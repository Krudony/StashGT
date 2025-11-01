
import React from 'react'

const Title = (props) => {
console.log(props)

  return (
    <div>
        Title ..........= {props.txt}
        Price = {props.price}
    </div>
  )
}

export default Title
