import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const HeroSection: React.FC = () => {
    const navigate = useNavigate();

    return (
        <section className="relative w-full h-screen min-h-[700px] overflow-hidden bg-gradient-to-br from-[#686DE0] to-[#4834D4] flex items-center justify-center">

            <div className="w-full max-w-[1700px] mx-auto px-6 sm:px-12 lg:px-16 xl:px-20 flex flex-col justify-center h-full pt-16 lg:pt-0">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 xl:gap-20 items-center h-full max-h-[900px]">

                    {/* Left Content Text */}
                    <div className="lg:col-span-5 xl:col-span-6 flex flex-col justify-center text-left z-10 w-full max-w-xl mx-auto lg:mx-0 py-10 lg:py-0">
                        {/* Badge */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full backdrop-blur-md w-fit mb-8 border border-white/20 shadow-lg"
                        >
                            <span className="text-yellow-400 text-sm">⚡</span>
                            <span className="text-white/90 text-[13px] font-semibold tracking-wide">Powered by Advanced AI</span>
                        </motion.div>

                        {/* Headline */}
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-[3rem] sm:text-[4rem] lg:text-[4.5rem] xl:text-[5rem] font-black tracking-tighter leading-[1.05] mb-6"
                        >
                            <div className="text-white drop-shadow-md relative">
                                Create
                            </div>
                            <div className="text-[#A19AE7] mix-blend-screen opacity-90 drop-shadow-md">
                                stunning
                            </div>
                            <div className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 drop-shadow-[0_2px_15px_rgba(236,72,153,0.3)]">
                                Visual
                            </div>
                            <div className="flex flex-wrap items-baseline gap-3 w-full">
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-pink-200 drop-shadow-md">Content</span>
                                <span className="text-white drop-shadow-md">in</span>
                            </div>
                            <div className="text-white drop-shadow-md">Seconds</div>
                        </motion.h1>

                        {/* Subtitle */}
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-lg sm:text-xl text-white/80 mb-8 max-w-md leading-relaxed font-light"
                        >
                            Generate professional images and videos with just a few words.
                        </motion.p>

                        {/* CTA Section */}
                        <div className="flex flex-col items-start gap-3">
                            <motion.button
                                onClick={() => navigate('/register')}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="px-8 py-4 bg-gradient-to-r from-[#45CEF7] to-[#2BA9F5] text-white rounded-2xl font-bold text-lg hover:scale-105 active:scale-95 transition-all shadow-[0_10px_40px_rgba(43,169,245,0.4)]"
                            >
                                Generate for free
                            </motion.button>
                            <motion.span
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="text-xs sm:text-sm text-white/50 ml-1 font-medium"
                            >
                                No credit card required • Free trial available
                            </motion.span>
                        </div>
                    </div>

                    {/* Right Content: 4-Panel Grid */}
                    <div className="lg:col-span-7 xl:col-span-6 h-full w-full relative hidden lg:flex items-center justify-center">
                        <div className="grid grid-cols-2 grid-rows-2 gap-4 xl:gap-6 w-full max-w-[650px] aspect-square lg:aspect-auto lg:h-[75%] mx-auto py-10">

                            {/* Panel 1 (Top Left): Eye */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
                                className="group relative rounded-3xl overflow-hidden border-[3px] sm:border-[4px] border-[#5A5ED9]/40 shadow-2xl bg-[#2A2D43]/50 col-span-1 row-span-1 cursor-pointer"
                                whileHover={{ scale: 1.05, zIndex: 10, borderColor: "rgba(255,255,255,0.8)" }}
                            >
                                <img
                                    src="https://images.unsplash.com/photo-1542204165-65bf26472b9b?auto=format&fit=crop&q=80&w=800"
                                    alt="Macro close-up of human eye with crystals"
                                    className="w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                                    <h3 className="text-white font-bold text-[15px] xl:text-lg mb-1 leading-tight">Hyper-Realistic Portraits</h3>
                                    <p className="text-white/70 text-[10px] xl:text-xs">Generate crystal-clear details in seconds.</p>
                                </div>
                            </motion.div>

                            {/* Panel 2 (Top Right): Video Preview */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ delay: 0.55, duration: 0.6, ease: "easeOut" }}
                                className="group relative rounded-3xl overflow-hidden border-[3px] sm:border-[4px] border-[#5A5ED9]/40 shadow-2xl bg-[#2A2D43]/50 col-span-1 row-span-1 cursor-pointer"
                                whileHover={{ scale: 1.05, zIndex: 10, borderColor: "rgba(255,255,255,0.8)" }}
                            >
                                <video
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    className="w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-110"
                                >
                                    <source src="https://cdn.pixabay.com/video/2023/10/22/186115-876939634_tiny.mp4" type="video/mp4" />
                                </video>
                                <div className="absolute top-3 right-3 lg:top-4 xl:right-4 bg-black/50 backdrop-blur-md rounded-full px-2 py-1 lg:p-2 flex items-center gap-1.5 lg:gap-2 border border-white/10 shadow-lg">
                                    <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-red-500 rounded-full animate-pulse"></div>
                                    <span className="text-[8px] xl:text-[10px] text-white font-bold tracking-wider uppercase">Live Render</span>
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                                    <h3 className="text-white font-bold text-[15px] xl:text-lg mb-1 leading-tight">Cinematic 3D Animation</h3>
                                    <p className="text-white/70 text-[10px] xl:text-xs">Turn text into stunning motion videos.</p>
                                </div>
                            </motion.div>

                            {/* Panel 3 (Bottom Left): Landscape */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ delay: 0.7, duration: 0.6, ease: "easeOut" }}
                                className="group relative rounded-3xl overflow-hidden border-[3px] sm:border-[4px] border-[#5A5ED9]/40 shadow-2xl bg-[#2A2D43]/50 col-span-1 row-span-1 cursor-pointer"
                                whileHover={{ scale: 1.05, zIndex: 10, borderColor: "rgba(255,255,255,0.8)" }}
                            >
                                <img
                                    src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800"
                                    alt="Futuristic sustainable city in the Amazon"
                                    className="w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                                    <h3 className="text-white font-bold text-[15px] xl:text-lg mb-1 leading-tight">Photorealistic Landscapes</h3>
                                    <p className="text-white/70 text-[10px] xl:text-xs">Build entire worlds from your imagination.</p>
                                </div>
                            </motion.div>

                            {/* Panel 4 (Bottom Right): Abstract Art */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ delay: 0.85, duration: 0.6, ease: "easeOut" }}
                                className="group relative rounded-3xl overflow-hidden border-[3px] sm:border-[4px] border-[#5A5ED9]/40 shadow-2xl bg-[#2A2D43]/50 col-span-1 row-span-1 cursor-pointer"
                                whileHover={{ scale: 1.05, zIndex: 10, borderColor: "rgba(255,255,255,0.8)" }}
                            >
                                <img
                                    src="https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80&w=800"
                                    alt="Complex abstract art"
                                    className="w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                                    <h3 className="text-white font-bold text-[15px] xl:text-lg mb-1 leading-tight">Textured Abstract Art</h3>
                                    <p className="text-white/70 text-[10px] xl:text-xs">Unique styles ready for any canvas.</p>
                                </div>
                            </motion.div>

                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default HeroSection;
