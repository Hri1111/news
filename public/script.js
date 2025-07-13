// Sample news data (in a real scenario, this would come from a database or API)
// For a production site, you'd fetch this data from your server's API endpoint.
const newsData = {
    world: [
        {
            title: "Global Leaders Meet for Climate Action",
            content: "Leaders from around the world gathered today to discuss pressing issues concerning climate change and sustainable economic development. Key agreements were reached to accelerate the transition to renewable energy sources.",
            image: "https://via.placeholder.com/600x300/a7a7a7/ffffff?text=World+Summit", // Example image URL
            video: "", // No video for this article
            source: "World News Network - July 13, 2025"
        },
        {
            title: "International Trade Agreements Signed, Boosting Global Economy",
            content: "New trade agreements were signed between major economic powers, aiming to boost global commerce and foster stronger international relations. Experts predict a positive impact on global markets.",
            image: "https://via.placeholder.com/600x300/696969/ffffff?text=Trade+Agreements",
            video: "",
            source: "Financial Times - July 12, 2025"
        },
        {
            title: "Space Exploration: New Discoveries on Distant Planets",
            content: "Astronomers announced groundbreaking discoveries on distant exoplanets, including evidence of liquid water and potential biosignatures, fueling excitement for future space missions.",
            image: "https://via.placeholder.com/600x300/404040/ffffff?text=Space+Discovery",
            video: "",
            source: "Cosmic Chronicle - July 11, 2025"
        }
    ],
    local: [
        {
            title: "Local Park Renovation Begins, Residents Excited",
            content: "The city council has announced the start of a major renovation project for the central park, including new playgrounds, landscaping, and improved recreational facilities. Local residents express enthusiasm for the upgrades.",
            image: "https://via.placeholder.com/600x300/808080/ffffff?text=Park+Renovation",
            video: "",
            source: "Local Gazette - July 13, 2025"
        },
        {
            title: "Community Event Draws Large Crowd, Fostering Unity",
            content: "A successful community fair was held over the weekend, featuring local artists, diverse food vendors, and family activities. The event fostered a strong sense of unity among residents.",
            image: "", // No image for this article
            video: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Example YouTube embed URL (Rick Astley - Never Gonna Give Up)
            source: "Town Crier - July 12, 2025"
        },
        {
            title: "New Public Library Branch Opens in West End",
            content: "A new branch of the public library has opened in the city's bustling West End, offering a wide array of books, digital resources, and community programs. It aims to become a new hub for learning.",
            image: "https://via.placeholder.com/600x300/c0c0c0/000000?text=Library+Opening",
            video: "",
            source: "City News - July 11, 2025"
        }
    ],
    sports: [
        {
            title: "Home Team Wins Championship in Thrilling Final",
            content: "Our beloved home team secured the championship title after a thrilling match against their long-time rivals. The stadium erupted in cheers as the final whistle blew.",
            image: "https://via.placeholder.com/600x300/a9a9a9/ffffff?text=Championship+Win",
            video: "",
            source: "Sports Times - July 13, 2025"
        },
        {
            title: "Athlete Sets New World Record in Track and Field",
            content: "A local athlete broke a world record in track and field, demonstrating incredible dedication and talent. This achievement has brought national attention to the local sports scene.",
            image: "https://via.placeholder.com/600x300/dcdcdc/000000?text=World+Record",
            video: "",
            source: "Athletics Weekly - July 12, 2025"
        },
        {
            title: "Olympic Hopes High for Local Swimmer",
            content: "A promising local swimmer has achieved qualifying times for the upcoming Olympics. Hopes are high for a medal as the training intensifies for the global competition.",
            image: "https://via.placeholder.com/600x300/8b8b8b/ffffff?text=Olympic+Swimmer",
            video: "",
            source: "Swim News - July 11, 2025"
        }
    ]
};

// --- News Article Loading Functionality ---

const newsContainer = document.getElementById('news-container');

/**
 * Loads news articles for a specified category into the main content area.
 * In a real application, this would fetch data from a server API.
 * @param {string} category - The category of news to load (e.g., 'world', 'local', 'sports').
 */
function loadCategory(category) {
    newsContainer.innerHTML = ''; // Clear existing content

    const articles = newsData[category];

    if (articles && articles.length > 0) {
        articles.forEach(article => {
            const articleDiv = document.createElement('div');
            articleDiv.classList.add('article');

            let mediaContent = '';
            if (article.image) {
                // Ensure img tags are responsive if part of the main article content
                mediaContent = `<img src="${article.image}" alt="${article.title}">`;
            } else if (article.video) {
                // For YouTube embeds, use iframe; ensure it's responsive within the container
                mediaContent = `<iframe width="100%" height="315" src="${article.video}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
            }

            articleDiv.innerHTML = `
                <h2>${article.title}</h2>
                ${mediaContent}  
                <p>${article.content}</p>
                <p class="article-source">Source: ${article.source}</p>
            `;
            newsContainer.appendChild(articleDiv);
        });
    } else {
        newsContainer.innerHTML = '<p>No news found for this category.</p>';
    }
}

// --- Uploaded Media Display Functionality ---

const mediaDisplayContainer = document.getElementById('media-display-container');

/**
 * Fetches the list of uploaded media from the server and displays
 * the latest few items in the sidebar.
 */
async function loadUploadedMedia() {
    mediaDisplayContainer.innerHTML = '<p>Loading latest uploads...</p>'; // Show loading message

    try {
        const response = await fetch('/media'); 
        
        if (!response.ok) {
            let errorMessage = `HTTP error! Status: ${response.status}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
            } catch (jsonError) { }
            throw new Error(errorMessage);
        }

        const mediaFiles = await response.json();

        if (mediaFiles.length > 0) {
            mediaDisplayContainer.innerHTML = ''; // Clear loading message

            const latestUploads = mediaFiles.slice().reverse().slice(0, 6); 

            latestUploads.forEach(media => {
                const mediaItemDiv = document.createElement('div');
                mediaItemDiv.classList.add('media-item');

                let content = '';
                if (media.type === 'image') {
                    content = `<img src="${media.path}" alt="${media.name}">`;
                } else if (media.type === 'video') {
                    content = `<video src="${media.path}" controls preload="metadata"></video>`;
                } else {
                    content = `<p>File: ${media.name}</p>`;
                }

                // Changed button placement to be BELOW the content
                mediaItemDiv.innerHTML = `
                    ${content}
                    <p title="${media.name}">${media.name}</p>
                    <button class="delete-media-button" data-filename="${media.name}">Delete</button>
                `;
                mediaDisplayContainer.appendChild(mediaItemDiv);
            });

            // After adding all media items, attach event listeners to the buttons
            document.querySelectorAll('.delete-media-button').forEach(button => {
                button.addEventListener('click', (event) => {
                    const filename = event.target.dataset.filename;
                    const mediaItemElement = event.target.closest('.media-item'); // Get the parent media-item div
                    deleteMediaItem(filename, mediaItemElement);
                });
            });

        } else {
            mediaDisplayContainer.innerHTML = '<p>No media uploaded yet.</p>';
        }
    } catch (error) {
        mediaDisplayContainer.innerHTML = `<p>Error loading media: ${error.message}. Please try refreshing.</p>`;
        console.error('Error fetching uploaded media:', error);
    }
}


// --- Initialization ---

// Load default news category and uploaded media when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    loadCategory('world'); // Load default news category
    loadUploadedMedia();   // Load uploaded media into the sidebar
});

// --- Uploaded Media Display Functionality ---

//const mediaDisplayContainer = document.getElementById('media-display-container');

// New function to handle deleting a media item
async function deleteMediaItem(filename, mediaItemElement) {
    // Add a client-side confirmation dialog
    const confirmation = confirm(`Are you sure you want to delete "${filename}"? This action cannot be undone.`);
    if (!confirmation) {
        return; // User cancelled deletion
    }

    try {
        const response = await fetch(`/media/${filename}`, { // DELETE request to your new endpoint
            method: 'DELETE',
        });

        const result = await response.json();

        if (response.ok) {
            console.log(result.message);
            // Remove the media item from the DOM immediately
            mediaItemElement.remove();
            // Optional: Re-fetch and re-render the list to ensure consistency and possibly load more items
            // This is useful if you want to refill the 'Latest Uploads' if it falls below 6 items
            loadUploadedMedia();
        } else {
            console.error('Delete failed:', result.message);
            alert(`Failed to delete "${filename}": ${result.message}`);
        }
    } catch (error) {
        console.error('Network error during delete:', error);
        alert(`A network error occurred while trying to delete "${filename}".`);
    }
}


