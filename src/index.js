// import React from 'react';
// import reportWebVitals from './reportWebVitals';
// import { BrowserRouter } from 'react-router-dom';
// import ReactDOM from 'react-dom/client';

// // custom imports
// import App from './App';
// import './index.css';

// // External libraries
// import { I18nextProvider } from 'react-i18next';
// import i18next from 'i18next';
// import englishMessage from './locales/en/message.json';
// import hindiMessage from './locales/hi/messages.json';
// import gujratiMessage from './locales/gj/message.json';

// const language = localStorage.getItem('i18nextLng');

// i18next.init({
//     interpolation: { escapeValue: false },
//     lng: language || 'en',
//     resources: {
//         en: {
//             msg: englishMessage,
//         },
//         hi: {
//             msg: hindiMessage,
//         },
//         gj: {
//             msg: gujratiMessage,
//       },
//     },
// });

// const root = ReactDOM.createRoot(document.getElementById('root'));
// root.render(
//   <BrowserRouter>
//     <I18nextProvider i18n={i18next}>
//         <App />
//     </I18nextProvider>
//   </BrowserRouter>
// );

// reportWebVitals();



import React from 'react';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from 'react-router-dom';
import ReactDOM from 'react-dom/client';

// ✅ Redux imports
import { Provider } from 'react-redux';
import { store } from './redux/store';

// custom imports
import App from './App';
import './index.css';

// External libraries
import { I18nextProvider } from 'react-i18next';
import i18next from 'i18next';
import englishMessage from './locales/en/message.json';
import hindiMessage from './locales/hi/messages.json';
import gujratiMessage from './locales/gj/message.json';

const language = localStorage.getItem('i18nextLng');

i18next.init({
    interpolation: { escapeValue: false },
    lng: language || 'en',
    resources: {
        en: {
            msg: englishMessage,
        },
        hi: {
            msg: hindiMessage,
        },
        gj: {
            msg: gujratiMessage,
        },
    },
});

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <Provider store={store}>   {/* ✅ Redux wrapper */}
    <BrowserRouter>
      <I18nextProvider i18n={i18next}>
        <App />
      </I18nextProvider>
    </BrowserRouter>
  </Provider>
);

reportWebVitals();