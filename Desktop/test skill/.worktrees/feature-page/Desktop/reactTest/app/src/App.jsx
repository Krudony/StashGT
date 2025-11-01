import React, { useState } from "react";

const App = () => {
  //Js

  const [msg, setMsg] = useState("Hello");

  const hdlshow = () => {
    setMsg("Test");
  };

  return (
    //Html Event ปุ่มเรียกฟังชั่น
    <div>
      {msg}
      <button onClick={hdlshow}> OK...Sucess</button>
    </div>
  );
};

export default App;
