export default function Privacy() {
    return (
        <div className="flex flex-col mt-25 w-[70%] max-w-[] m-auto">
            <div className="flex flex-col items-center text-center gap-5">
                <h1 className="text-7xl font-semibold">Privacy Policy</h1>
                <p className="text-2xl text-gray-600 font-light">Your privacy is important to us. This privacy policy explains <br/>
                how we collect, use, and protect your information.</p>   
            </div>   
            <div className="flex flex-col gap-10 mt-15">
                <div>
                    <h1 className="text-4xl font-semibold">Information We Collect</h1>
                    <p className="text-xl text-gray-500">We collect information you provide to us, such your name, email address, and
                    payment details. We also collect data about your usage of our services.</p>
                </div>
                <div>
                    <h1 className="text-4xl font-semibold">How We Use Your Information</h1>
                    <p className="text-xl text-gray-500">We collect information you provide to us, such your name, email address, and
                    payment details. We also collect data about your usage of our services.</p>
                </div>
                <div>
                    <h1 className="text-4xl font-semibold">Information Sharing</h1>
                    <p className="text-xl text-gray-500">We do not share your persomal information with third paties except as
                    necessary to provide our services.</p>
                </div>
            </div>         
        </div>
    );
}