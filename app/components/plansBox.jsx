import plansData from 'app/plansData'

export default function plansBox() {
    return (
        <div className="flex gap-6"> {/* This wrapper is required */}
            {plansData.map(plan => (
                <div key={plan.id} className='w-1/3 flex justify-center flex-col items-center border-gray-300 rounded-2xl border-1'>
                    <img className='w-1/2' src={plan.img.src} alt={plan.img.alt} />
                    <h1 className='font-bold text-2xl'>
                        {plan.status} <br />
                        ${plan.price}
                        <span className='font-light text-lg'>/mo</span>
                    </h1>
                    <ul className='text-gray-600 flex flex-col gap-1 mt-3 h-[90px]'>
                        {plan.features.map((feature, index) => (
                            <li key={index}>{feature}</li>
                        ))}
                    </ul>
                    <button className='text-lg btn-primary text-white w-[190px] py-3 rounded-xl mt-3 mb-5'>
                        {plan.buttonText}
                    </button>
                </div>
            ))}
        </div>
    )
}