
const form = document.querySelector('form[name=fileupload]');
const file_input = form.querySelector('input[type=file]');

async function upload() {
    if (file_input.files.length < 1) {
        return;
    }

    const response = await fetch(form.action, {
        method: 'post',
        body: new FormData(form)
    });
    if (response.status === 200) {
        const result = await response.json();
        console.log(result);

        const result_div = document.getElementById('result');
        let links = `<a href="/f/${result.filename}" target="_blank">${result.filename}</a><br>`;
        for (const ext of result.external) {
            links += `<a href="${ext}" target="_blank">${ext}</a></br>`;
        }

        result_div.innerHTML = links;
        result_div.style = '';
    }
}

function init() {
    const choose_file = document.querySelector('#choose-file');
    const show_file = document.querySelector('#file-chosen');

    form.addEventListener('submit', (ev) => {
        ev.preventDefault();
        upload();
    });

    form.addEventListener('drop', (ev) => {
        ev.preventDefault();
        file_input.files = ev.dataTransfer.files
        upload();
    });

    form.addEventListener('dragover', (ev) => ev.preventDefault());

    choose_file.addEventListener('click', () => { file_input.click(); });
    file_input.addEventListener('change', () => {
        show_file.innerHTML = file_input.value;
        upload();
    });
}
init();