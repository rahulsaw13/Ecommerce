# srirammart.com — Server Setup & Deploy Guide

Server: `72.61.242.55` | Repo: `https://github.com/rahulsaw13/Ecommerce.git`

---

## Initial Setup (done once — already complete)

### 1. Install Node.js on server
```bash
ssh -i ~/.ssh/server_72_61_242_55 root@72.61.242.55
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
```

### 2. Clone repo and build
```bash
mkdir -p /var/www/srirammart
cd /var/www/srirammart
git clone -b rahulsaw https://github.com/rahulsaw13/Ecommerce.git .

# Do NOT set REACT_APP_BASE_URL — empty string lets the build use relative URLs (multi-tenant)
cat > .env.production << 'EOF'
REACT_APP_UPI_ID=merchant@upi
REACT_APP_UPI_MERCHANT_NAME=Srirammart
EOF

npm install
npm run build:prod
```

### 3. Nginx config
File: `/etc/nginx/sites-available/srirammart.com`

```nginx
server {
    listen 80;
    server_name srirammart.com www.srirammart.com;

    client_max_body_size 50M;

    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 120s;
        proxy_connect_timeout 60s;
    }

    location /uploads/ {
        root /opt/dukansarthi;
        try_files $uri @old_server_uploads;
    }
    location @old_server_uploads {
        proxy_pass http://31.97.207.15;
        proxy_set_header Host 31.97.207.15;
    }

    location / {
        root /var/www/srirammart/build;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
```

Enable:
```bash
ln -sf /etc/nginx/sites-available/srirammart.com /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### 4. SSL Certificate

> Only run after DNS A record points to 72.61.242.55 and propagates.

```bash
certbot --nginx -d srirammart.com -d www.srirammart.com --non-interactive --agree-tos -m rahulsaw13@gmail.com
```

**If certbot fails with "Invalid response" on an old IPv6 address:**

Let's Encrypt tries IPv6 first. If the old AAAA record is still cached in their resolvers, the challenge hits the old server and fails.

Fix: temporarily remove the AAAA record from Hostinger DNS, run certbot, then add it back.

```bash
# After removing AAAA from Hostinger, verify only IPv4 resolves:
nslookup srirammart.com 1.1.1.1

# Then run certbot again:
certbot --nginx -d srirammart.com -d www.srirammart.com --non-interactive --agree-tos -m rahulsaw13@gmail.com

# After cert is issued, re-add AAAA record in Hostinger:
# Type: AAAA | Name: @ | Value: 2a02:4780:12:6005::1
```

### 5. Add tenant row in DB
```bash
sudo -u postgres psql -d dukaansarthi_app_clone
```
```sql
INSERT INTO ecommerce_tenants (domain, company_id, branch_id)
VALUES ('srirammart.com', 6889, 6889);
-- 6889 = same company as srirammart-dev.dukaansarthi.com
-- For a new company on a new domain, use their company_id from user_front table
```

### 6. Multi-tenant architecture

One React build served from `/var/www/srirammart/build/` (srirammart.com) and `/var/www/ecommerce/` (srirammart-dev.dukaansarthi.com). Both call the same Tomcat backend on port 8080.

- Frontend sends `X-Tenant-Domain: <hostname>` header on every request (set in `src/api/api.js`)
- Backend `resolveTenant()` in `EcommerceAppController` looks up `ecommerce_tenants` by domain → gets `company_id` / `branch_id`
- `GET /user_dashboard/company_info` returns name, address, phone from `user_front` table for that company
- Frontend Redux slice (`companySlice.js`) fetches on startup and updates `document.title`

To add a new domain/company:
1. Add Nginx server block pointing to `/var/www/srirammart/build/` (or copy build there)
2. `INSERT INTO ecommerce_tenants (domain, company_id, branch_id) VALUES ('newdomain.com', <id>, <id>);`
3. Reload Nginx — no code change or rebuild needed

---

## Future Updates (deploy new frontend code)

```bash
ssh -i ~/.ssh/server_72_61_242_55 root@72.61.242.55
cd /var/www/srirammart
git pull origin rahulsaw
npm run build:prod
# Copy same build to the dev site (both domains serve the same React build)
cp -r /var/www/srirammart/build/. /var/www/ecommerce/
systemctl reload nginx
```

> `.env.production` is NOT tracked in git — it lives only on the server.  
> Do NOT add `REACT_APP_BASE_URL` to `.env.production` — blank is correct for multi-tenant.

## Backend WAR deploy

Build locally on Windows, then upload and deploy:

```powershell
# 1. Build WAR (run in F:\dukansarthi)
.\mvnw.cmd package -DskipTests
```

```bash
# 2. Upload
scp -i ~/.ssh/server_72_61_242_55 F:\dukansarthi\target\vyaparerp-2.0.1.war root@72.61.242.55:/tmp/

# 3. Deploy
ssh -i ~/.ssh/server_72_61_242_55 root@72.61.242.55
systemctl stop tomcat
cp /opt/tomcat/webapps/ROOT.war /opt/tomcat/webapps/ROOT.war.bak_$(date +%Y%m%d)
rm -rf /opt/tomcat/webapps/ROOT /opt/tomcat/webapps/ROOT.war
cp /tmp/vyaparerp-2.0.1.war /opt/tomcat/webapps/ROOT.war
systemctl start tomcat

# 4. Verify (wait ~30s for startup)
sleep 30 && curl -s -o /dev/null -w '%{http_code}' \
  -H 'X-Tenant-Domain: srirammart.com' \
  http://localhost:8080/api/v1/ecommerce/user_dashboard/company_info
# Expected: 200
```

---

## Hostinger DNS settings

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | `@` | `72.61.242.55` | 300 |
| A | `www` | `72.61.242.55` | 300 |
| AAAA | `@` | `2a02:4780:12:6005::1` | 300 |
| AAAA | `www` | `2a02:4780:12:6005::1` | 300 |

---

## Verification Checklist

- [ ] `nslookup srirammart.com` → `72.61.242.55`
- [ ] `https://srirammart.com` loads storefront
- [ ] Green padlock (SSL valid)
- [ ] Products load (API calls to `srirammart.com/api/...`)
- [ ] Dev site `srirammart-dev.dukaansarthi.com` still works (untouched)
