import OurStoryImage from "@assets/our_story.webp";

const OurStory = () => {
    return (
        <section className="text-gray-600 body-font overflow-hidden p-6 sm:px-10">
            <div className="w-full">
                <div className="mx-auto flex flex-wrap">
                    <img
                        alt="ecommerce"
                        className="lg:w-1/2 w-full lg:h-auto h-64 object-cover object-center rounded mb-6 lg:mb-0"
                        src={OurStoryImage}
                    />
                    <div className="lg:w-1/2 w-full flex flex-col lg:pl-10 lg:py-6 justify-center">
                        <h1 className="text-[1.4rem] sm:text-[2rem] md:text-[2.5rem] text-[#1D2E43] font-[playfair] font-bold mb-6 sm:mb-8">
                            Our Story
                        </h1>
                        <p className="leading-relaxed text-[14px] sm:text-[16px] md:text-[18px]">
                            Logo's success stems from its blend of tradition, innovation, and unwavering quality.
                            Its dynamism is fueled by a continuous effort to revamp products and packaging to align
                            with the evolving demographics of India.
                        </p>
                        <p className="leading-relaxed mt-3 sm:mt-4 text-[14px] sm:text-[16px] md:text-[18px]">
                            Logo is dedicated to authenticity, sourcing ingredients like saffron from Kashmir for
                            Malpua and paneer from Delhi for savory delights, proving that great taste knows no
                            boundaries.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default OurStory;