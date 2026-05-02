document.addEventListener('DOMContentLoaded', () => {
    const spotlightGroups = document.querySelectorAll('.spotlight-group');

    spotlightGroups.forEach((group) => {
        const cards = group.querySelectorAll('.spotlight-card');

        group.addEventListener('mousemove', (event) => {
            cards.forEach((card) => {
                const rect = card.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;

                card.style.setProperty('--mouse-x', `${x}px`);
                card.style.setProperty('--mouse-y', `${y}px`);
            });
        });
    });

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        },
        {
            threshold: 0.12,
            rootMargin: '0px 0px -48px 0px',
        }
    );

    document.querySelectorAll('.reveal-on-scroll').forEach((element) => {
        observer.observe(element);
    });
});
