const all = {
    
    controller: {
        moveMouse: async function(x, y) {
            const response = await fetch('http://localhost:3300/movemouse', {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    mouse: {x,y}
                })
            })
            console.log(response);
            return response;
        }
    }

};

for(const fn in all) {
    window[fn] = all[fn];
}

export default all;