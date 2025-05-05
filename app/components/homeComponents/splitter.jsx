import { Noto_Sans } from 'next/font/google'

const roboto = Noto_Sans   ({
    subsets: ['latin']
})

export default function splitter() {
    return (
        <div className={roboto.className}>
            <div className='flex justify-center items-center text-center gap-10 mb-10'>
                <div className='w-1/4 h-1 bg-gray-300 rounded-e-2xl rounded-s-4xl splitter'></div>
                <h1 className='text-xl font-semibold text-gray-400'>Models</h1>
                <div className='w-1/4 h-1 bg-gray-300 rounded-e-2xl rounded-s-4xl splitter'></div>
            </div>
        </div>

    )
}