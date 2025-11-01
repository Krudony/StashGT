import React from "react";

const Sellbook = ({ children, data }) => {
  console.log(data);

  return (
    <div>
      {data.map((el, i) => {
        console.log(el.name);
        return <h1 key={i}>{el.suname}</h1>;
      })}
    </div>
  );
};

export default Sellbook;
