export default function modelBox() {
    return (
        <div className='border-gray-300 border-2 min-w-[250px] w-1/4 p-1 rounded-2xl'>
            <div className='p-3.5 flex flex-col gap-5'>
                <div className='flex gap-4'>
                    <img src='logo.png' alt='models png' className='max-w-[65px]'/>
                    <div className='flex flex-col gap-2'>
                        <h2 className='text-2xl font-semibold'>Model Name</h2>
                        <span className='flex gap-1 text-gray-500'>author: <p>@username</p></span>
                    </div>
                </div>
                <div className='flex gap-3'>
                    <div style={{backgroundColor:'#efe7ff'}} className='font-light p-1 rounded-xl'>Vision</div>
                    <div style={{backgroundColor:'#efe7ff'}} className='font-light p-1 rounded-xl'>CNN</div>
                </div>
                <span className='flex gap-1'>Price: <span className='flex'>$<p>25</p></span></span>
                <button className='btn-primary text-white rounded-xl py-2 text-lg'>View</button>
            </div>
        </div>
    )
}