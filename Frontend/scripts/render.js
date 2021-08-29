
const sendButton = document.getElementById('btn')

document.getElementById('btnReg').onclick = async function register(){
    window.loadFile('./html/login.html')
}


window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
        const element = document.getElementById(selector)
        if (element) 
            element.innerText = text
    }
    for (const dependency of ['chrome', 'node', 'electron']) {
        replaceText(`${dependency}-version`, process.versions[dependency])
    }
})