import PlansBox from "@/app/components/plansBox";

export default function PlansPage() {
    return (
        <div className='min-h-screen flex justify-center items-center'>
            <div className='max-w-[1500px] w-[80%] m-auto flex flex-col gap-10'>
                <div>
                    <h1>Choose Your Plan</h1>
                    <p>Flexible pricing for individuals and teams</p>
                </div>
                <div className='flex items-center justify-center gap-3'>
                    <PlansBox />
                    <PlansBox />
                    <PlansBox />
                </div>
            </div>
        </div>
    )
}