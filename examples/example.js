import React, { useState } from "react";
import QrReader from "react-qr-scanner";

function Example() {
  const [codeRead, setCodeRead] = useState("");

  function onScan(result) {
    console.log(`Identified: ${result}`);
    setCodeRead(result);
  }

  function onError(error) {
    console.error(error);
  }

  return (
    <div>
      <QrReader
        delay={500}
        style={{
          width: 320,
          height: 240,
        }}
        onError={onError}
        onScan={onScan}
      />
      <p>{codeRead}</p>
    </div>
  );
}

export default Example;
