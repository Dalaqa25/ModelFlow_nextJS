import plansData from 'app/plansData'

export default function plansBox() {
    return (
        <div className="flex flex-col items-center sm:flex-row gap-10 justify-center">
            {plansData.map(plan => (
                <div key={plan.id} className='w-1/3 flex justify-center flex-col items-center border-gray-300 rounded-2xl border-1 min-w-[300px]'>
                    <img className='w-1/2' src={plan.img.src} alt={plan.img.alt} />
                    <h1 className='font-bold text-2xl xl:text-3xl'>{plan.title}
                        {plan.status} <br />
                        ${plan.price}
                        <span className='font-light text-lg'>/mo</span>
                    </h1>
                    <ul className='text-gray-600 flex flex-col gap-1 mt-3 h-[90px] xl:text-xl'>
                        {plan.features.map((feature, index) => (
                            <li key={index}> - {feature}</li>
                        ))}
                    </ul>
                    <button className='btn-primary text-white w-1/2 py-3 rounded-xl xl:mt-6 mb-5 '>
                        {plan.buttonText}
                    </button>
                </div>
            ))}
        </div>
    )
}