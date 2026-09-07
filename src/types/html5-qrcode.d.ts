declare module "html5-qrcode" {
  export class Html5Qrcode {
    constructor(elementId: string, config?: any);
    start(
      cameraConfig: any,
      configuration: any,
      qrCodeSuccessCallback: (decodedText: string, result: any) => void,
      qrCodeErrorCallback?: (errorMessage: string) => void
    ): Promise<null>;
    stop(): Promise<void>;
    clear(): void;
  }
  export class Html5QrcodeScanner {
    constructor(elementId: string, config: any, verbose: boolean);
    render(
      onScanSuccess: (decodedText: string, decodedResult: any) => void,
      onScanFailure?: (error: any) => void
    ): void;
    clear(): Promise<void>;
  }
}
