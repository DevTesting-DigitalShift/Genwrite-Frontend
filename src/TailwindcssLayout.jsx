import React from 'react'

const TailwindcssLayout = () => {
    return (
        <>
            <h1 className='  text-4xl mb-4 text-center font-extrabold uppercase'>this is code snippet for different responsive layout</h1>


            <h3 className=' mb-4 text-3xl  text-center font-bold'>"sm" means smaller and above screen </h3>

            <div className="equalDistrubution">

                <h3 className='text-2xl m-4  font-bold'>Equal Distribution </h3>

                <p className='text-xl m-12'>2 boxes are in one row but once smaller than sm get in each row </p>
                <div className="box1">
                    <div className='grid m-4  gap-4 sm:grid-cols-2'>
                        <div className='min-h-[100px] bg-red-500 rounded shadow-xl'></div>
                        <div className='min-h-[100px] bg-orange-500 rounded shadow-xl'></div>
                    </div>
                </div>



                <p className='text-xl m-12'> 3 boxes are in same line for all sizes </p>

                <div className="box2">
                    {/* in this i want that all 3 boxes are in same line  */}
                    <div className='grid m-4 gap-4  grid-cols-3 sm:grid-cols-3'>
                        <div className='min-h-[100px] bg-purple-500 rounded shadow-xl'></div>
                        <div className='min-h-[100px] bg-teal-500 rounded shadow-xl'></div>
                        <div className='min-h-[100px] bg-blue-500 rounded shadow-xl'></div>
                    </div>
                </div>





            </div>




            <div className="m-12"></div>

            <h3 className='text-2xl m-4  font-bold'>Non-Equal Distribution (in this make the row divide in 12  parts and then give acc to cols) </h3>



            <div className="non-equal-distrubution">

                <p className='text-xl m-12'>2 boxes in one row but when smaller that sm get in each row </p>

                <div className="box1">
                    {/* in this i want that all 2boxes are in ome row but once smaller thatn sm get in each row */}
                    <div className='grid m-4 gap-4 sm:grid-cols-12  '>

                        <div className='min-h-[100px] sm:col-span-10 bg-purple-500 rounded shadow-xl'></div>
                        <div className='min-h-[100px] sm:col-span-2  bg-pink-500 rounded shadow-xl'></div>
                    </div>
                </div>





                <p className='text-xl m-12'>2 boxes in one row but when smaller that sm get 2 equal parts </p>

                <div className="box2">
                    <div className='grid m-4 gap-4 grid-cols-2 sm:grid-cols-12  '>

                        <div className='min-h-[100px] sm:col-span-8 bg-red-500 rounded shadow-xl'></div>
                        <div className='min-h-[100px] sm:col-span-4  bg-teal-500 rounded shadow-xl'></div>
                    </div>
                </div>


                <p className='text-xl m-12'>3 boxes in one row but when smaller that sm smaller get hide </p>


                <div className="box4">
                    {/* in this i want that all 3 boxes are in ome row but once smaller big one remain on screen */}
                    <div className='grid m-4 gap-4  sm:grid-cols-12  '>

                        <div className='min-h-[100px] sm:col-span-2 hidden sm:block  bg-black rounded shadow-xl'></div>
                        <div className='min-h-[100px] sm:col-span-8 bg-green-500 rounded shadow-xl'></div>
                        <div className='min-h-[100px] sm:col-span-2  hidden sm:block bg-pink-500 rounded shadow-xl'></div>
                    </div>
                </div>
            </div>




            <img className='mr-12 p-12' src="./Images/chai.png" alt="" />

        </>
    )
}

export default TailwindcssLayout