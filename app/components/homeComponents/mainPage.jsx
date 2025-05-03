export default function mainPage() {
    return (
        <main className='flex mt-15 items-center justify-center '>
            <section className='flex justify-between w-[85%] max-w-[1250px]'>
                <div className='flex flex-col justify-center gap-9'>
                    <div style={{background:'rgba(63,77,223,0.75)', color:'#fff'}} className='py-1.5 px-8 text-sm rounded-2xl w-[120px] text-center'>HOME</div>
                    <h1 className='text-6xl font-semibold'>
                        Upload And  <br/> Sell Pre-Trained <br/>
                        <span style={{color:'#6472ef'}}>AI</span> Models.
                    </h1>
                    <p className='text-gray-400 text-[18px]'>Pre-trained AI models for businesses</p>
                    <button style={{background:'#6472ef'}} className='py-4 text-white text-sm w-[170px] hover:shadow-xl rounded-2xl'>Get Started</button>
                </div>
                <img src='/main.png' alt='main' className='w-[45%] animate-float'/>
            </section>
        </main>
    )
}