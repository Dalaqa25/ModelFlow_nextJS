const plansData = [
    {
        id: 1,
        img: {
            src: "plansImg1.png",
            alt: "Plans 1 image",
        },
        status: "Free",
        features: [
            "Feature one",
            "Feature two",
        ],
        price: 0,
        buttonText: 'Get started'
    },
    {
        id: 2,
        img: {
            src: "plansImg2.png",
            alt: "Plans 2 image",
        },
        status: "Pro",
        features: [
            "Feature one",
            "Feature two",
            "Feature three"
        ],
        price: 15,
        buttonText: 'Subscribe now'
    },
    {
        id: 3,
        img: {
            src: "plansImg2.png",
            alt: "Plans 2 image",
        },
        status: "Enterprise/Custom",
        features: [

        ],
        price: '...',
        buttonText: 'Contact us'
    }
]

export default plansData;