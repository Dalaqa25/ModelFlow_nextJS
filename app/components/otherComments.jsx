import { IoClose } from "react-icons/io5";

const comments = [
    { id: 1, nickname: "Alice", text: "Fsdfskjbfsbfshdfjkshfkjsdfkjbsfjkhsfbsjfhskjfnkshfbkfhfkjsbvjsbvkbvsbvkjsvndjkfhkjsbvjksvbkbvkjvhsbfvkjvhbvskjv" },
    { id: 2, nickname: "Bob", text: "Fsdfskjbfsbfshdfjkshfkjsdfkjbsfjkhsfbsjfhskjfnkshfbkfhfkjsbvjsbvkbvsbvkjsvndjkfhkjsbvjksvbkbvkjvhsbfvkjvhbvskjv" },
    { id: 3, nickname: "Charlie", text: "Fsdfskjbfsbfshdfjkshfkjsdfkjbsfjkhsfbsjfhskjfnkshfbkfhfkjsbvjsbvkbvsbvkjsvndjkfhkjsbvjksvbkbvkjvhsbfvkjvhbvskjv" },
    // ...more comments
];

export default function OtherComments({ onClose }) {
    return (
        <div className="absolute left-0 top-0 w-full h-full bg-gray-100 rounded-xl shadow overflow-y-auto z-20 border-2 border-gray-200">
            <IoClose
                onClick={onClose}
                className="text-3xl bg-gray-200 cursor-pointer absolute z-30 right-2 top-1 rounded-full hover:bg-gray-300 transition-all"
            />
            <div className="py-6">
                {comments.map((comment, idx) => (
                    <div
                        key={comment.id}
                        className={`w-full flex items-center my-2 px-4 mb-3 ${idx % 2 === 0 ? 'justify-start' : 'justify-end'}`}
                    >
                        <div className={`p-3 rounded-2xl bg-white max-w-[60%] ${idx % 2 === 0 ? '' : 'bg-purple-50'} break-words flex flex-col`}>
                            <span className="text-xs text-gray-500 font-semibold mb-1">{comment.nickname}</span>
                            <p className="text-base break-words font-light text-gray-700">{comment.text}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}