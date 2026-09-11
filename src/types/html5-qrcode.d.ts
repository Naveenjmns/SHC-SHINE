declare module "html5-qrcode" {
  export interface CameraDevice {
    id: string;
    label: string;
  }

  export class Html5Qrcode {
    constructor(elementId: string, config?: any);
    static getCameras(): Promise<Array<CameraDevice>>;
    start(
      cameraConfig: any,
      configuration: any,
      qrCodeSuccessCallback: (decodedText: string, result: any) => void,
      qrCodeErrorCallback?: (errorMessage: string) => void
    ): Promise<null>;
    stop(): Promise<void>;
    clear(): void;
    getState(): number;
    pause(shouldPauseVideo?: boolean): void;
    resume(): void;
    applyVideoConstraints(videoConstraints: any): Promise<void>;
    getRunningTrackCapabilities(): any;
    scanFile(imageFile: File, showImage?: boolean): Promise<string>;
    scanFileV2(imageFile: File, showImage?: boolean): Promise<any>;
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
