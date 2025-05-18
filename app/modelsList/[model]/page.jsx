import Image from 'next/image'

export default async function Model({ params }) {
    return (
        <section className='mt-20 w-[80%] max-w-[1500px] m-auto'>
            <div className='flex'>
                <div className="relative w-32 h-32 sm:w-70 sm:h-70">
                    <Image
                        src="/PlansImg2.png"
                        alt="main/profile image"
                        fill
                        className="object-contain"
                        sizes="(max-width: 800px) 100vw, 200px"
                    />
                </div>
            </div>
        </section>
    )
}