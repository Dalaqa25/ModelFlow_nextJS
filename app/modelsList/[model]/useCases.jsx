export default function useCases({useCases}) {
    return (
            <div className='mt-10 mb-10 w-full flex flex-col gap-5'>
                <h2 className='text-4xl font-semibold'>Use Cases</h2>
                <div className='flex justify-between w-full'>
                    {useCases}
                </div>
            </div>
    )
}