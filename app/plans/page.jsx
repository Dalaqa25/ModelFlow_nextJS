import PlansBox from "@/app/components/plansBox";
import Image from "next/image";
import Footer from "../components/homeComponents/footer";

export default function PlansPage() {
    return (
        <>
            <div className='mt-20 text-center flex justify-center items-center'>
                <div className='max-w-[1500px] w-[80%] m-auto flex flex-col gap-10'>
                    <div>
                        <h1 className='font-semibold text-5xl xl:text-6xl'>Choose Your Plan</h1>
                        <p className='font-light text-2xl xl:text-4xl'>Flexible pricing for individuals and teams</p>
                    </div>
                    <PlansBox />
                    <div className='w-1/3 flex justify-center flex-col items-center border-gray-300 rounded-2xl border-1 m-auto mb-10 min-w-[200px]'>
                        <Image width={1024} height={1024} className='w-1/2 ' src='/default-image.png' alt='plans image 1'/>
                        <h1 className='text-2xl font-semibold'>Custom Plan</h1>
                        <button className='text-lg btn-primary text-white px-10 py-3 rounded-xl mt-3 mb-5 '>Contact us</button>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    )
}