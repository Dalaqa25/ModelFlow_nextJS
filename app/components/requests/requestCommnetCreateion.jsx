import { FiSend } from "react-icons/fi";

export default function requestCommnetCreateion() { 
    return (
        <div className="w-full flex mt-2.5 ml-2.5 items-center">
            <form className="p-2 w-1/2 rounded-2xl bg-white" action="">
                <textarea
                    type="text"
                    id="name"
                    placeholder="write a comment..."
                    className="bg-white p-2 w-full text-base focus:outline-none focus:ring-0 focus:border-transparent font-light resize-none overflow-y-auto"
                />
                <FiSend className="cursor-pointer text-2xl ml-auto hover:text-purple-800 transition-all"/>
            </form>
        </div>
    )
}