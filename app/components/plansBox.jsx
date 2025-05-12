export default function plansBox() {
    return (
        <div className='w-1/3 flex justify-center flex-col items-center'>
            <img className='w-1/2 ' src='plansImg1.png' alt='plans image 1'/>
            <h1>Free <br/> $<span>0<span>/mo</span></span> </h1>
            <ul className='h-[200px] border-2'>
                <li>up to 5 uploads</li>
                <li>up to 5 uploads</li>
                <li>up to 5 uploads</li>
            </ul>
            <button className='text-lg btn-primary text-white px-10 py-3 rounded-2xl'>Get started</button>
        </div>
    )
}