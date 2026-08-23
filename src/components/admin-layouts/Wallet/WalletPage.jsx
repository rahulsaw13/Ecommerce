import { useEffect, useState, useRef } from "react";
import { allApiWithHeaderToken } from "@api/api";
import { API_CONSTANTS } from "@constants/apiurl";
import AdminPanelLoader from "@common/AdminPanelLoader";
import { Toast } from "primereact/toast";

const WalletPage = () => {
  const toast = useRef(null);
  const [loader, setLoader] = useState(false);
  const [walletEnabled, setWalletEnabled] = useState(false);
  const [users, setUsers] = useState([]);
  const [bonusAmount, setBonusAmount] = useState("");
  const [selectedUserId, setSelectedUserId] = useState(""); // "" = all users
  const [searchTerm, setSearchTerm] = useState("");
  const [addingBonus, setAddingBonus] = useState(false);
  const [togglingWallet, setTogglingWallet] = useState(false);

  const showToast = (severity, detail) => {
    toast.current?.show({ severity, summary: severity === "success" ? "Success" : "Error", detail, life: 3000 });
  };

  const fetchSettings = async () => {
    setLoader(true);
    try {
      const res = await allApiWithHeaderToken(API_CONSTANTS.WALLET_ADMIN_SETTINGS, "", "get");
      if (res.status === 200) setWalletEnabled(res.data?.data?.wallet_enabled || false);
    } catch (err) {
      showToast("error", "Failed to load wallet settings");
    } finally {
      setLoader(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await allApiWithHeaderToken(API_CONSTANTS.WALLET_ADMIN_USERS, "", "get");
      if (res.status === 200) setUsers(res.data?.data || []);
    } catch (err) {
      // silently fail — users list is non-critical
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchUsers();
  }, []);

  const handleToggleWallet = async () => {
    setTogglingWallet(true);
    try {
      const res = await allApiWithHeaderToken(API_CONSTANTS.WALLET_ADMIN_SETTINGS, { wallet_enabled: !walletEnabled }, "put");
      if (res.status === 200) {
        setWalletEnabled(!walletEnabled);
        showToast("success", `Wallet ${!walletEnabled ? "enabled" : "disabled"} successfully`);
      }
    } catch (err) {
      showToast("error", "Failed to update wallet settings");
    } finally {
      setTogglingWallet(false);
    }
  };

  const handleAddBonus = async () => {
    const amount = parseFloat(bonusAmount);
    if (!bonusAmount || isNaN(amount) || amount <= 0) {
      showToast("error", "Enter a valid bonus amount");
      return;
    }
    setAddingBonus(true);
    try {
      const body = { amount };
      if (selectedUserId) body.user_id = parseInt(selectedUserId);

      const res = await allApiWithHeaderToken(API_CONSTANTS.WALLET_ADMIN_BONUS, body, "post");
      if (res.status === 200 && res.data?.status) {
        const credited = res.data?.data?.users_credited || 1;
        showToast("success", `₹${amount} bonus added to ${credited} user${credited !== 1 ? "s" : ""}`);
        setBonusAmount("");
        setSelectedUserId("");
        fetchUsers(); // Refresh balances
      } else {
        showToast("error", res.data?.message || "Failed to add bonus");
      }
    } catch (err) {
      showToast("error", err?.response?.data?.message || "Failed to add bonus");
    } finally {
      setAddingBonus(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase();
    return (
      !term ||
      (u.name || "").toLowerCase().includes(term) ||
      (u.phone || "").includes(term) ||
      (u.email || "").toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-BgPrimaryColor p-4 md:p-6">
      {loader && <AdminPanelLoader />}
      <Toast ref={toast} position="top-right" style={{ scale: "0.7" }} />

      <h2 className="text-2xl font-bold text-TextPrimaryColor mb-6">Wallet Management</h2>

      {/* Toggle Section */}
      <div className="bg-BgSecondaryColor border border-BorderColor rounded-lg p-5 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-lg font-semibold text-TextPrimaryColor">Wallet Feature</h3>
            <p className="text-sm text-TextSecondaryColor mt-1">
              {walletEnabled
                ? "Wallet is active. Users can use their balance at checkout."
                : "Wallet is disabled. Enable to let users pay with wallet balance."}
            </p>
          </div>
          <button
            onClick={handleToggleWallet}
            disabled={togglingWallet}
            className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none ${
              walletEnabled ? "bg-green-500" : "bg-gray-300"
            } ${togglingWallet ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                walletEnabled ? "translate-x-8" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Add Bonus Section */}
      <div className="bg-BgSecondaryColor border border-BorderColor rounded-lg p-5 mb-6">
        <h3 className="text-lg font-semibold text-TextPrimaryColor mb-4">Add Wallet Bonus</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-TextSecondaryColor mb-1">Amount (₹)</label>
            <input
              type="number"
              min="1"
              value={bonusAmount}
              onChange={(e) => setBonusAmount(e.target.value)}
              placeholder="e.g. 50"
              className="w-full rounded border border-BorderColor px-3 py-2 text-sm bg-BgPrimaryColor text-TextPrimaryColor focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-TextSecondaryColor mb-1">
              User <span className="text-xs text-gray-400">(leave empty for all users)</span>
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full rounded border border-BorderColor px-3 py-2 text-sm bg-BgPrimaryColor text-TextPrimaryColor focus:outline-none"
            >
              <option value="">All Users</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name || u.phone || u.email} — ₹{(u.wallet_balance || 0).toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleAddBonus}
            disabled={addingBonus}
            className="rounded bg-green-600 hover:bg-green-700 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {addingBonus
              ? "Adding..."
              : selectedUserId
              ? "Add to User"
              : "Add to All Users"}
          </button>
        </div>
      </div>

      {/* Users Wallet Balance Table */}
      <div className="bg-BgSecondaryColor border border-BorderColor rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <h3 className="text-lg font-semibold text-TextPrimaryColor">User Wallet Balances</h3>
          <input
            type="text"
            placeholder="Search by name, phone or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64 rounded border border-BorderColor px-3 py-2 text-sm bg-BgPrimaryColor text-TextPrimaryColor focus:outline-none"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-BorderColor text-left text-TextSecondaryColor">
                <th className="pb-2 pr-4 font-semibold">Name</th>
                <th className="pb-2 pr-4 font-semibold">Phone</th>
                <th className="pb-2 pr-4 font-semibold">Email</th>
                <th className="pb-2 font-semibold text-right">Wallet Balance</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-TextSecondaryColor">
                    {users.length === 0 ? "No users found" : "No users match the search"}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="border-b border-BorderColor last:border-0">
                    <td className="py-3 pr-4 text-TextPrimaryColor">{u.name || "—"}</td>
                    <td className="py-3 pr-4 text-TextSecondaryColor">{u.phone || "—"}</td>
                    <td className="py-3 pr-4 text-TextSecondaryColor">{u.email || "—"}</td>
                    <td className="py-3 text-right font-semibold text-green-600">
                      ₹{(u.wallet_balance || 0).toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WalletPage;
