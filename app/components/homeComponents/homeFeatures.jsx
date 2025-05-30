import Image from 'next/image';
import { motion } from 'framer-motion';

export default function HomeSecurity() {
    return (
        <div className="w-[80%] lg:w-[70%] max-w-[1400px] mx-auto flex flex-col gap-8 lg:gap-15">
            {/* Security Section */}
            <motion.div 
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="w-full min-h-[300px] lg:h-[350px] bg-[#f4f3fb] flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-25 rounded-3xl py-8"
            >
                <Image
                    src="/security.png"
                    alt="Security Image"
                    width={1024}
                    height={1024}
                    className="w-30 h-30 sm:w-50 sm:h-50 lg:w-90 lg:h-90 object-contain"
                />  
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    viewport={{ once: true }}
                    className='text-center lg:text-left lg:mr-20'
                >
                    <h1 className='text-4xl lg:text-7xl font-semibold'>Built for <br/> Security</h1>
                    <p className='text-xl lg:text-3xl text-gray-600 mt-2 font-light'>Security features designed <br/>to protect your models</p>
                </motion.div>
            </motion.div>

            {/* middle (ease upload) */}
            <motion.div 
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className='w-full flex flex-col-reverse lg:flex-row items-center justify-between gap-6 lg:gap-0'
            >
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    viewport={{ once: true }}
                    className='text-center lg:text-left lg:ml-15'
                >
                    <h1 className='text-4xl lg:text-7xl font-semibold'>Streamlined <br/>Workflow</h1>
                    <p className='text-xl lg:text-3xl text-gray-600 mt-2 font-light'>Upload, manage and <br/>deploy models with ease</p>
                </motion.div>
                <Image
                    src="/flyingRobot.png"
                    alt="Flying Robot Image"
                    width={1024}
                    height={1024}
                    className="w-30 h-30 sm:w-50 sm:h-50 lg:w-90 lg:h-90 object-contain"
                />
            </motion.div>

            {/* search models */}
            <motion.div 
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className='w-full min-h-[300px] lg:max-h-[400px] flex flex-col lg:flex-row bg-[#d3ccfe] items-center justify-between rounded-3xl overflow-hidden mb-10 lg:mb-20 shadow py-8'
            >
                <div className="relative">
                    <div className="block lg:hidden">
                        <Image
                            src="/3dcube.png"
                            alt="Phone svg Image Mobile"
                            width={1024}
                            height={1024}
                            className="w-40 h-40 sm:w-60 sm:h-60 object-contain"
                        />
                    </div>
                    <div className="hidden lg:block">
                        <Image
                            src="/phone.svg"
                            alt="Phone svg Image Desktop"
                            width={1024}
                            height={1024}
                            className="w-90 h-90 object-contain mt-70"
                        />
                    </div>
                </div>
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    viewport={{ once: true }}
                    className='text-center lg:text-left lg:mr-15'
                >
                    <h1 className='text-4xl lg:text-7xl font-semibold'>Explore<br/>AI Models</h1>
                    <p className='text-xl lg:text-3xl text-gray-600 mt-2 font-light'>Upload, manage and <br/>deploy models with ease</p>
                </motion.div>
            </motion.div>

            <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className='text-center text-3xl lg:text-6xl font-semibold mb-15'
            >
                Don't waste time start building <br/> something great!
            </motion.h1>
        </div>
    )
}