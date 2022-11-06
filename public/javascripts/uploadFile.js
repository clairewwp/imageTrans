// const progress = document.getElementById("progress");
const form=document.getElementById('form')
const description=document.getElementById('description')
const alert=document.getElementById('alert')
let file = document.getElementById('image-files')


file.addEventListener('change',Upload);

//select files from local then display on the panel
function Upload() {
    description.style.display = "none";
    const imageFiles = file.files;
    // console.log(imageFiles)
    for (const file of imageFiles) {
        if (!validImageType(file)){
            alert.innerHTML='Invalid image type for uploading, please re-select';
            window.onload = setInterval(() => alert.style.opacity = '0', 15000)
            continue
        }
        const image = document.createElement('img');
        const file_reader = new FileReader();

        // uploaded file is displayed in the table
        file_reader.addEventListener("load", () => {
            image.src = file_reader.result;
            // console.log(image.src)
            const row = imageTable.insertRow(imageTable.rows.length);
            row.insertCell(0).innerHTML =`<img src="${image.src}">`;
            row.insertCell(1).innerHTML = (file.name);
            row.insertCell(2).innerHTML = `<input type="button" id="delete" value="Delete" onclick="deleteRow(this)" class="btn"/>`;
        }, false);
        if (file) {
            file_reader.readAsDataURL(file);
        }
    }
}
// Delete selected files
function deleteRow(row)
{
    let i = row.parentNode.parentNode.rowIndex;
    document.getElementById('imageTable').deleteRow(i);
    if (imageTable.rows.length === 0) {
        description.style.display = "block";
    }
}
function validImageType(file) {
    console.log("validation")
    const fileTypes = [
        "image/webp",
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/svg",
        "image/jpg",
    ];
    return fileTypes.includes(file.type);
}

form.addEventListener("submit", async event=>{
    event.preventDefault();
    console.log(file.files.length)
    const formData = new FormData();
    for(let i = 0 ; i < file.files.length; i++){
        formData.append("file"+i, file.files[i]);
        let Width=document.getElementById('Width').value
        let Height=document.getElementById('Height').value
        formData.append("Width",Width)
        formData.append('Height',Height)
    }   
    let data = await fetch('/upload',{
        method:"post",
        body:formData,
    }).catch((error)=>{console.log(error)});
    data = await data.json()
    let count = 0;
    for( let i in data){        
        console.log(data[i].source)
        count++
    }
    console.log(`${count} of transcoding completed`)
})