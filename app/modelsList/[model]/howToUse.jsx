export default function HowToUse({setup}) {
    return (
            <div className='mt-10 mb-10 w-full flex flex-col gap-2 sm:gap-5'>
                <h2 className='text-2xl font-semibold sm:text-4xl'>How to use / set up</h2>
                <p className='font-light text-lg text-gray-600'>
                    {setup}
                </p>
            </div>
    )
}