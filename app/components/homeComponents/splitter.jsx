import { Noto_Sans } from 'next/font/google'

const roboto = Noto_Sans   ({
    subsets: ['latin']
})

export default function splitter() {
    return (
        <div className={roboto.className}>
            <div className='flex justify-center items-center text-center gap-10 mb-10'>
                <div className='w-1/3 h-1.5 bg-gray-300 rounded-4xl'></div>
                <h1 className='text-3xl font-semibold text-gray-400'>Key Features</h1>
                <div className='w-1/3 h-1.5 bg-gray-300 rounded-4xl'></div>
            </div>
        </div>

    )
}