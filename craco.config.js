const path = require('path');

module.exports = {
    webpack: {
        alias: {
            '@common': path.resolve(__dirname, 'src/components/common'),
            '@common-sections': path.resolve(__dirname, 'src/components/common-sections'),
            '@pages': path.resolve(__dirname, 'src/pages'),
            '@userpage-pages': path.resolve(__dirname, 'src/components/userpage'),
            '@assets': path.resolve(__dirname, 'src/assets'),
            '@styles': path.resolve(__dirname, 'src/styles'),
            '@hooks': path.resolve(__dirname, 'src/hooks'),
            '@constants': path.resolve(__dirname, 'src/constants'),
            '@api': path.resolve(__dirname, 'src/api'),
            '@store': path.resolve(__dirname, 'src/useCartStore.js'),
            '@userpage': path.resolve(__dirname, 'src/pages/userpage'),
            '@adminpage-layouts': path.resolve(__dirname, 'src/components/admin-layouts'),
            '@adminpage-components': path.resolve(__dirname, 'src/components'),
            '@userpage-components': path.resolve(__dirname, 'src/components/userpage'),
            '@api-constant': path.resolve(__dirname, 'src/api'),
            '@helper': path.resolve(__dirname, 'src/helper/helper.js'),
            '@utils': path.resolve(__dirname, 'src/utils'),
            '@config': path.resolve(__dirname, 'src/config'),
            '@services': path.resolve(__dirname, 'src/services'),
        },
    }
};