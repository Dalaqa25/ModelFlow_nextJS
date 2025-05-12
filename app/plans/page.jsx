import PlansBox from "@/app/components/plansBox";

export default function PlansPage() {
    return (
        <div className='min-h-screen text-center flex justify-center items-center'>
            <div className='max-w-[1500px] w-[80%] m-auto flex flex-col gap-10'>
                <div>
                    <h1 className='font-semibold text-5xl'>Choose Your Plan</h1>
                    <p className='font-light text-2xl'>Flexible pricing for individuals and teams</p>
                </div>
                <div className='flex items-center justify-center gap-6'>
                    <PlansBox />
                </div>
            </div>
        </div>
    )
}