import Image from 'next/image';
import { motion } from 'framer-motion';

export default function HomeSecurity() {
    return (
        <div className="w-[70%] max-w-[1400px] mx-auto flex flex-col gap-15">
            
            {/* Security Section */}
            <motion.div 
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="w-full h-[350px] bg-[#f4f3fb] flex items-center justify-center-safe gap-25 rounded-3xl"
            >
                <Image
                    src="/security.png"
                    alt="Security Image"
                    width={1024}
                    height={1024}
                    className="w-32 h-32 sm:w-40 sm:h-40 md:w-90 md:h-90 object-contain"
                />  
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    viewport={{ once: true }}
                    className='mr-20'
                >
                    <h1 className='text-7xl font-semibold'>Built for <br/> Security</h1>
                    <p className='text-3xl text-gray-600 mt-2 font-light'>Security featuers designed <br/>to protect your models</p>
                </motion.div>
            </motion.div>

            {/* middle (ease upload) */}
            <motion.div 
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className='w-full flex items-center justify-between'
            >
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    viewport={{ once: true }}
                    className='ml-15'
                >
                    <h1 className='text-7xl font-semibold'>Streamlined <br/>Workflow</h1>
                    <p className='text-3xl text-gray-600 mt-2 font-light'>Upload,manage and <br/>deploy models with ease</p>
                </motion.div>
                <Image
                    src="/flyingRobot.png"
                    alt="flyng Robot Image"
                    width={1024}
                    height={1024}
                    className="w-32 h-32 sm:w-40 sm:h-40 md:w-100 md:h-100 object-contain"
                />
            </motion.div>

            {/* search models */}
            <motion.div 
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className='w-full max-h-[400px] flex bg-[#d3ccfe] items-center justify-between rounded-3xl overflow-y-hidden mb-20 shadow'
            >
                <Image
                    src="/phone.svg"
                    alt="Phone svg Image"
                    width={1024}
                    height={1024}
                    className="w-32 h-32 sm:w-40 sm:h-40 md:w-150 md:h-150 object-contain mt-70"
                />
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    viewport={{ once: true }}
                    className='mr-15'
                >
                    <h1 className='text-7xl font-semibold'>Explore<br/>AI Models</h1>
                    <p className='text-3xl text-gray-600 mt-2 font-light'>Upload,manage and <br/>deploy models with ease</p>
                </motion.div>
            </motion.div>

            <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className='text-center text-6xl font-semibold'
            >
                Don't waste time start building <br/> something great!
            </motion.h1>
        </div>
    )
}