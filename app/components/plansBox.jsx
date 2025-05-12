export default function plansBox() {
    return (
        <div className='w-1/3 flex justify-center flex-col items-center border-gray-300 rounded-2xl border-1'>
            <img className='w-1/2 ' src='plansImg1.png' alt='plans image 1'/>
            <h1 className='font-bold text-2xl'>Free <br/> $<span>0<span className='font-light text-lg'>/mo</span></span> </h1>
            <ul className='text-gray-600 flex flex-col gap-1 mt-3'>
                <li>up to 5 uploads</li>
                <li>up to 5 uploads</li>
                <li>up to 5 uploads</li>
            </ul>
            <button className='text-lg btn-primary text-white px-10 py-3 rounded-xl mt-3 mb-5'>Get started</button>
        </div>
    )
}