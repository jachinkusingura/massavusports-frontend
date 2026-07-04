// Mobile Navigation Toggle
document.addEventListener('DOMContentLoaded', () => {
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const navLinks = document.getElementById('nav-links');

    if (mobileBtn && navLinks) {
        mobileBtn.addEventListener('click', () => {
            navLinks.classList.toggle('open');
            const icon = mobileBtn.querySelector('i');
            if (icon) {
                icon.className = navLinks.classList.contains('open')
                    ? 'fa-solid fa-xmark'
                    : 'fa-solid fa-bars';
            }
        });

        // Close nav when a link is clicked on mobile
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('open');
                const icon = mobileBtn.querySelector('i');
                if (icon) icon.className = 'fa-solid fa-bars';
            });
        });
    }

    // Restore Nav on Resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && navLinks) {
            navLinks.classList.remove('open');
        }
    });

    // ── Auto-set active nav link based on current page & tag ──
    (function setActiveNav() {
        const page = window.location.pathname.split('/').pop() || 'index.html';
        const tag = new URLSearchParams(window.location.search).get('tag') || '';
        document.querySelectorAll('.nav-links a').forEach(a => {
            const href = a.getAttribute('href') || '';
            const linkPage = href.split('?')[0];
            const linkTag = new URLSearchParams(href.split('?')[1] || '').get('tag') || '';
            const pageMatch = linkPage === page || (page === '' && linkPage === 'index.html');
            const tagMatch = !linkTag || linkTag.toLowerCase() === tag.toLowerCase();
            if (pageMatch && tagMatch) a.classList.add('active');
        });
    })();

    // ── Page-load slim progress bar ──
    (function startProgressBar() {
        let bar = document.getElementById('nprogress-bar');
        if (!bar) {
            bar = document.createElement('div');
            bar.id = 'nprogress-bar';
            document.body.prepend(bar);
        }
        bar.style.width = '0%'; bar.style.opacity = '1';
        let w = 0;
        const tick = setInterval(() => {
            w = w < 70 ? w + Math.random() * 12 : w + Math.random() * 2;
            if (w > 90) w = 90;
            bar.style.width = w + '%';
        }, 200);
        window.addEventListener('load', () => {
            clearInterval(tick);
            bar.style.width = '100%';
            setTimeout(() => { bar.style.opacity = '0'; }, 400);
        });
    })();

    // Handle Query Params
    const urlParams = new URLSearchParams(window.location.search);

    // --- PAGE CONTROLLERS ---

    // 1. Grid Page (Home / Category)
    const newsGrid = document.querySelector('.news-grid');
    if (newsGrid) {
        const tag = urlParams.get('tag');
        if (tag && window.location.pathname.includes('category.html')) {
            const pageHeading = document.querySelector('h1 .text-accent');
            if (pageHeading) pageHeading.textContent = tag;
            document.title = `${tag} | MassavuSports`;
        }
        showGridSkeletons(newsGrid);
        fetchPosts(tag);
    }

    // 2. Detail Page (Event)
    const eventDetail = document.getElementById('eventDetail');
    if (eventDetail) {
        const id = urlParams.get('id');
        console.log('Event Page Detected. Post ID:', id);
        if (id) {
            fetchSinglePost(id);
        } else {
            console.error('No ID found in URL for eventDetailPage');
            const bodyEl = document.getElementById('eventBody');
            if (bodyEl) bodyEl.innerHTML = '<p style="color: red; padding: 2rem; text-align: center;">Error: No Event ID provided. <a href="index.html">Go Back Home</a></p>';
        }
    }

    // --- FUNCTIONS ---

    function showGridSkeletons(grid, count = 6) {
        grid.innerHTML = Array.from({ length: count }).map(() => `
            <div class="card-skeleton">
                <div class="sk-card-img"></div>
                <div class="sk-card-line" style="width:70%;margin-top:1.2rem;"></div>
                <div class="sk-card-line" style="width:90%;"></div>
                <div class="sk-card-line short"></div>
            </div>`).join('');
    }

    async function fetchPosts(tag = null) {
        const cacheKey = `posts_${tag || 'all'}`;
        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData) {
            try { renderPosts(JSON.parse(cachedData)); } catch (e) { }
        }

        try {
            let url = 'https://massavusports-backend-api.onrender.com/api/posts';
            if (tag) url += `?tag=${encodeURIComponent(tag)}`;

            const response = await fetch(url);
            const result = await response.json();
            if (result.status === 'success') {
                localStorage.setItem(cacheKey, JSON.stringify(result.data.posts));
                renderPosts(result.data.posts);
            }
        } catch (error) {
            console.error('Fetch error:', error);
            if (!cachedData && newsGrid) {
                newsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 2rem;">Offline or Server Error.</p>';
            }
        }
    }

    function renderPosts(posts) {
        if (!newsGrid) return;
        if (!posts || posts.length === 0) {
            newsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 2rem;">No posts found.</p>';
            return;
        }

        newsGrid.innerHTML = posts.map(post => {
            const date = new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const imageUrl = post.featuredImage ? `https://massavusports-backend-api.onrender.com/public/uploads/${post.featuredImage}` : 'assets/images/hero.jpg';
            const category = post.tags && post.tags.length > 0 ? post.tags[0].name : 'News';
            const truncated = post.content.substring(0, 100) + '...';

            return `
                <article class="news-card">
                    <div class="card-img" style="height: 200px; background: url('${imageUrl}') no-repeat center center/cover; border-radius: var(--radius-md) var(--radius-md) 0 0;"></div>
                    <div class="card-content">
                        <span class="tag">${category}</span>
                        <h3><a href="event.html?id=${post.id}">${post.title}</a></h3>
                        <p class="text-muted" style="font-size: 0.9rem; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin: 0.5rem 0;">${truncated}</p>
                        <div class="card-footer" style="padding-top: 1rem; border-top: 1px solid var(--border-color); margin-top: 1rem; display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--text-muted);">
                            <span><i class="fa-regular fa-calendar"></i> ${date}</span>
                            <span><i class="fa-regular fa-eye"></i> ${post.views} Views</span>
                        </div>
                    </div>
                </article>
            `;
        }).join('');
    }

    async function fetchSinglePost(id) {
        const cacheKey = `post_${id}`;
        const overlay = document.getElementById('loadingOverlay');

        // Try to render from cache immediately (no spinner needed)
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            try {
                renderEventDetail(JSON.parse(cached), /* fromCache */ true);
            } catch (e) { /* corrupt cache — ignore */ }
        }

        // Show circular spinner only while the network request is live
        if (overlay) overlay.classList.add('visible');

        try {
            console.log('Fetching post:', id);
            const response = await fetch(`https://massavusports-backend-api.onrender.com/api/posts/${id}`);
            const result = await response.json();
            if (result.status === 'success') {
                localStorage.setItem(cacheKey, JSON.stringify(result.data.post));
                renderEventDetail(result.data.post, /* fromCache */ false);
            } else {
                throw new Error(result.message || 'Post not found');
            }
        } catch (error) {
            console.error('Detail fetch error:', error);
            // Only show error state if we have nothing cached to fall back on
            if (!cached) {
                const titleEl = document.getElementById('eventTitle');
                if (titleEl) { titleEl.textContent = 'Post Unavailable'; titleEl.style.display = ''; }
                hideSkeleton();
                const bodyEl = document.getElementById('eventBody');
                if (bodyEl) bodyEl.innerHTML = `<p style="color: red; padding: 2rem; text-align: center;">Error: ${error.message}. Please check your connection.</p>`;
            }
        } finally {
            if (overlay) overlay.classList.remove('visible');
        }
    }

    function hideSkeleton() {
        ['skTitle', 'skTitleSm', 'skMeta', 'skHero'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
        const titleEl = document.getElementById('eventTitle');
        const metaEl = document.getElementById('eventMetaReal');
        const heroEl = document.getElementById('eventHero');
        if (titleEl) titleEl.style.display = '';
        if (metaEl) metaEl.style.display = '';
        if (heroEl) { heroEl.style.display = ''; setTimeout(() => heroEl.style.opacity = '1', 50); }
    }

    function renderEventDetail(post, fromCache = false) {
        console.log('Rendering post details:', post.title);
        const titleEl = document.getElementById('eventTitle');
        const dateEl = document.getElementById('eventDate');
        const viewsEl = document.getElementById('eventViews');
        const locEl = document.getElementById('eventLocation');
        const heroEl = document.getElementById('eventHero');
        const tagsEl = document.getElementById('eventTags');
        const bodyEl = document.getElementById('eventBody');

        if (titleEl) titleEl.textContent = post.title;
        document.title = `${post.title} | MassavuSports`;

        const dateStr = new Date(post.createdAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        if (dateEl) dateEl.innerHTML = `<i class="fa-regular fa-calendar text-accent"></i> ${dateStr}`;
        if (viewsEl) viewsEl.innerHTML = `<i class="fa-solid fa-eye text-muted"></i> ${post.views.toLocaleString()} Views`;
        if (locEl) locEl.innerHTML = `<i class="fa-solid fa-location-dot text-accent"></i> ${post.location || 'Local'}`;

        if (heroEl) {
            const src = post.featuredImage ? `https://massavusports-backend-api.onrender.com/public/uploads/${post.featuredImage}` : 'assets/images/hero.jpg';
            heroEl.src = src;
        }

        if (tagsEl && post.tags) {
            tagsEl.innerHTML = `<span style="font-weight: 600; color: var(--bg-dark); margin-right: 0.5rem;">Tags:</span>` +
                post.tags.map(t => `<span class="tag" style="margin: 0 0.2rem;">${t.name}</span>`).join('');
        }

        if (bodyEl) {
            bodyEl.innerHTML = post.content.split('\n').filter(p => p.trim()).map(p => `<p style="margin-bottom: 1.5rem;">${p.trim()}</p>`).join('');
        }

        hideSkeleton();
    }
});
