import { FaLanguage, FaEye, FaComments, FaImage } from "react-icons/fa";
import { MdTranslate } from "react-icons/md";


export default function Filter() { 
    const tags = [
        { label: "NLP", icon: <FaLanguage /> },
        { label: "Computer Vision", icon: <FaEye /> },
        { label: "Chatbot", icon: <FaComments /> },
        { label: "Image Generation", icon: <FaImage /> },
        { label: "Translation", icon: <MdTranslate /> },
    ];

    return (
        <div className='h-1/2 w-[400px] hidden lg:block rounded-lg cutom-shadow'>
            <div className="grid gap-2 p-4">
                {tags.map((tag, i) => (
                    <div key={i} className="flex items-center gap-4 bg-gray-100 p-3 rounded-md cursor-pointer hover:bg-blue-100">
                        <span className="text-purple-700 text-lg">{tag.icon}</span>
                        <span className="text-lg font-medium">{tag.label}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}