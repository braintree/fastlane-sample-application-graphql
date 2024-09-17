export interface CustomWindow extends Window {
    braintree: any;
}

declare var window: CustomWindow;