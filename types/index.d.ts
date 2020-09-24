export default Reader;

interface ReaderProps {
  onError: (error: any) => any;
  onScan: (result: string) => any;
  onLoad: () => any;
  onImageLoad: () => any;

  delay: number | true;
  facingMode: "rear" | "front";
  legacyMode: boolean;
  maxImageSize: number;
  style: React.CSSProperties;
  className: string;
  chooseDeviceId: PropTypes.func;
}

declare class Reader extends Component<ReaderProps, any, any> {
  constructor(props: any);
  els: {};
  initialStreamStarted: boolean;
  initiate(
    props?: Readonly<any> &
      Readonly<{
        children?: import("react").ReactNode;
      }>
  ): void;
  initiateLegacyMode(): void;
  check(): void;
  handleVideo(stream: any): void;
  handleLoadStart(): void;
  handleInputChange(e: any): void;
  clearComponent(): void;
  handleReaderLoad(e: any): void;
  openImageDialog(): void;
  handleWorkerMessage(e: any): void;
  setRefFactory(key: any): (element: any) => void;
  worker: Worker;
  timeout: NodeJS.Timeout;
  stopCamera: any;
  reader: FileReader;
}
declare namespace Reader {
  namespace propTypes {
    const onScan: any;
    const onError: any;
    const onLoad: any;
    const onImageLoad: any;
    const delay: any;
    const facingMode: any;
    const legacyMode: any;
    const maxImageSize: any;
    const style: any;
    const className: any;
    const chooseDeviceId: any;
  }
  namespace defaultProps {
    const delay_1: number;
    export { delay_1 as delay };
    const maxImageSize_1: number;
    export { maxImageSize_1 as maxImageSize };
    const facingMode_1: string;
    export { facingMode_1 as facingMode };
  }
}
import { Component } from "react";
