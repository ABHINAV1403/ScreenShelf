// Ensure folders and movies are always arrays/objects
let folders = JSON.parse(localStorage.getItem("folders") || "[]");
let movies = JSON.parse(localStorage.getItem("movies") || "{}");

// OMDb API key (replace with your own key)
const apiKey = "d9d78fdc";

// Function to render folders in the homepage
function renderFolders() {
    const folderContainer = document.getElementById("folderContainer");
    folderContainer.innerHTML = ""; // Clear the container before re-rendering

    folders.forEach(folderName => {
        const folderDiv = document.createElement("div");
        folderDiv.classList.add("folder");
        folderDiv.textContent = folderName;

        // Click event to open the folder
        folderDiv.onclick = () => openFolder(folderName);

        folderContainer.appendChild(folderDiv);
    });
}

// Function to add a new folder
document.getElementById("addFolderBtn").onclick = function () {
    const folderName = prompt("Create New Folder");

    if (folderName) {
        if (!folders.includes(folderName)) {
            folders.push(folderName);
            localStorage.setItem("folders", JSON.stringify(folders)); // Save to localStorage
            renderFolders(); // Refresh UI
        } else {
            alert("Folder already exists!");
        }
    }
};

// Function to open a folder
function openFolder(folderName) {
    localStorage.setItem("currentFolder", folderName); // Store the folder name
    document.getElementById("folderContainer").classList.add("hidden"); // Hide folder grid
    document.getElementById("folderView").classList.remove("hidden"); // Show folder view
    document.getElementById("folderTitle").textContent = folderName; // Set folder title
    document.getElementById("addFolderBtn").classList.add("hidden"); // Hide (+) button

    // Render movies in the folder
    renderMovies(folderName);
}

// Function to delete a folder
document.getElementById("deleteFolderBtn").onclick = function () {
    const currentFolder = localStorage.getItem("currentFolder");
    if (confirm(`Are you sure you want to delete the folder "${currentFolder}"?`)) {
        // Remove the folder from the folders array
        folders = folders.filter(folder => folder !== currentFolder);
        localStorage.setItem("folders", JSON.stringify(folders)); // Update localStorage

        // Remove movies associated with the folder
        delete movies[currentFolder];
        localStorage.setItem("movies", JSON.stringify(movies)); // Update localStorage

        // Go back to the homepage
        document.getElementById("folderView").classList.add("hidden");
        document.getElementById("folderContainer").classList.remove("hidden");
        document.getElementById("addFolderBtn").classList.remove("hidden");

        // Refresh the folders list
        renderFolders();
    }
};

// Function to rename a folder
document.getElementById("renameFolderBtn").onclick = function () {
    const currentFolder = localStorage.getItem("currentFolder");
    const newFolderName = prompt(`Rename folder "${currentFolder}" to:`);

    if (newFolderName && newFolderName.trim() !== "") {
        if (folders.includes(newFolderName)) {
            alert("A folder with this name already exists!");
        } else {
            // Update the folder name in the folders array
            const index = folders.indexOf(currentFolder);
            folders[index] = newFolderName;
            localStorage.setItem("folders", JSON.stringify(folders)); // Update localStorage

            // Update the movies object with the new folder name
            movies[newFolderName] = movies[currentFolder];
            delete movies[currentFolder];
            localStorage.setItem("movies", JSON.stringify(movies)); // Update localStorage

            // Update the UI
            document.getElementById("folderTitle").textContent = newFolderName;
            localStorage.setItem("currentFolder", newFolderName); // Update current folder name
            renderFolders(); // Refresh the folders list on the homepage
        }
    }
};

// Back button functionality
document.getElementById("backBtn").onclick = function () {
    document.getElementById("folderView").classList.add("hidden"); // Hide folder view
    document.getElementById("folderContainer").classList.remove("hidden"); // Show folder grid
    document.getElementById("addFolderBtn").classList.remove("hidden"); // Show (+) button
};

// Function to fetch movie suggestions from OMDb API
async function fetchMovieSuggestions(query) {
    const url = `https://www.omdbapi.com/?s=${encodeURIComponent(query)}&apikey=${apiKey}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.Search || []; // Return the search results or an empty array
    } catch (error) {
        console.error("Error fetching data:", error);
        return [];
    }
}

// Function to display search results as a dropdown
function displaySearchResults(results) {
    const movieResults = document.getElementById("movieResults");
    movieResults.innerHTML = ""; // Clear previous results

    results.forEach(movie => {
        const movieDiv = document.createElement("div");
        movieDiv.classList.add("movie-suggestion");
        movieDiv.textContent = `${movie.Title} (${movie.Year})`;
        movieDiv.onclick = () => addMovieToFolder(movie);
        movieResults.appendChild(movieDiv);
    });
}

// Function to handle search input
document.getElementById("searchBox").addEventListener("input", async function (event) {
    const query = event.target.value.trim();
    if (query.length >= 3) { // Only search if the query has at least 3 characters
        const results = await fetchMovieSuggestions(query);
        displaySearchResults(results);
    } else {
        document.getElementById("movieResults").innerHTML = ""; // Clear results if query is too short
    }
});

// Function to add a movie to the current folder
function addMovieToFolder(movie) {
    const currentFolder = localStorage.getItem("currentFolder");

    if (!movies[currentFolder]) {
        movies[currentFolder] = [];
    }

    // Check if the movie is already in the folder
    if (!movies[currentFolder].some(m => m.imdbID === movie.imdbID)) {
        movie.watched = false; // Default to "Yet to Watch"
        movies[currentFolder].push(movie);
        localStorage.setItem("movies", JSON.stringify(movies)); // Save to localStorage
        renderMovies(currentFolder); // Refresh movie list
    } else {
        alert("This movie is already in the folder!");
    }
}

// Function to render movies in a folder
function renderMovies(folderName) {
    const movieResults = document.getElementById("movieResults");
    movieResults.innerHTML = ""; // Clear previous results

    if (movies[folderName]) {
        movies[folderName].forEach((movie, index) => {
            const movieDiv = document.createElement("div");
            movieDiv.classList.add("movie");

            // Movie title and year
            const movieInfo = document.createElement("span");
            movieInfo.textContent = `${movie.Title} (${movie.Year})`;
            movieDiv.appendChild(movieInfo);

            // Watched/Yet to Watch toggle
            const toggleButton = document.createElement("button");
            toggleButton.textContent = movie.watched ? "Watched" : "Mark as watched";
            toggleButton.classList.add("toggle-button");
            toggleButton.onclick = () => toggleWatchedStatus(folderName, index);
            movieDiv.appendChild(toggleButton);

            // Delete movie button
            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Delete";
            deleteButton.classList.add("delete-button");
            deleteButton.onclick = () => deleteMovieFromFolder(folderName, index);
            movieDiv.appendChild(deleteButton);

            movieResults.appendChild(movieDiv);
        });
    }
}

// Function to toggle watched status
function toggleWatchedStatus(folderName, index) {
    movies[folderName][index].watched = !movies[folderName][index].watched;
    localStorage.setItem("movies", JSON.stringify(movies)); // Update localStorage
    renderMovies(folderName); // Refresh movie list
}

// Function to delete a movie from a folder
function deleteMovieFromFolder(folderName, index) {
    if (confirm("Are you sure you want to delete this movie?")) {
        movies[folderName].splice(index, 1); // Remove the movie
        localStorage.setItem("movies", JSON.stringify(movies)); // Update localStorage
        renderMovies(folderName); // Refresh movie list
    }
}

// Ensure folders are displayed when the page loads
document.addEventListener("DOMContentLoaded", renderFolders);