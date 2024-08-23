// import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App.tsx"
import AppProvider from "./context/AppProvider.tsx"
import "@/styles/global.css"

// store.ts
import { createStore } from 'redux';
import { Provider } from 'react-redux';

// A simple reducer (modify as needed)
const rootReducer = (state = {}, action: any) => state;

const store = createStore(rootReducer);


ReactDOM.createRoot(document.getElementById("root")!).render(
    <Provider store={store}>
    <AppProvider>
        <App />
    </AppProvider>,
    </Provider>
)
