const btn = document.getElementById('markAsRead');

function fetchAndMarkThreads(courseId, authToken, page = 1, tabId) {
    const limit = 30; // Nombre de threads par page

    fetch(`https://eu.edstem.org/api/courses/${courseId}/threads?filter=unread&limit=${limit}&sort=new&page=${page}`, {
        headers: {
            'x-token': authToken
        }
    })
    .then(response => response.json())
    .then(data => {
        const threads = data.threads;
        
        const markThreadsPromises = threads.map(thread => {
            return fetch(`https://eu.edstem.org/api/threads/${thread.id}/read`, {
                method: 'POST',
                headers: {
                    'x-token': authToken
                }
            });
        });

        return Promise.all(markThreadsPromises).then(() => threads.length);
    })
    .then(threadsLength => {
        if (threadsLength === limit) {
            // Il y a probablement plus de threads à traiter
            fetchAndMarkThreads(courseId, authToken, page + 1);
        } else {
            btn.style.backgroundColor = '#4CAF50';
            btn.textContent = "Marquer comme lu";

            chrome.tabs.reload(tabId);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

btn.addEventListener('click', async () => {

    btn.textContent = "Marquer comme lu en cours...";
    btn.style.backgroundColor = "#ccc";

    try {
        const key = "authToken"

        // Get the current tab
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const tab = tabs[0]; 

        // Execute script in the current tab
        const fromPageLocalStore = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => localStorage['authToken']
        });

        // Store the result  
        await chrome.storage.local.set({[key]:fromPageLocalStore[0]});

        const authToken = fromPageLocalStore[0].result;

        const courseId = tab.url.split('/')[5];

        fetchAndMarkThreads(courseId, authToken, undefined, tab.id);

    } 
    catch(err) {
        alert(err);
        // Log exceptions
    }
});
