import React from 'react'

const Book = ({children,data1}) => {
   console.log(data1)
  return (
    <div>

        {
               data1.map((el,i)=>{

                console.log(el)

                    return i == 1 ? <h1 key ={i}>Test...map{el.id} {el.name}</h1> :null 

               }) 

        }
    </div>
  )
}

export default Book