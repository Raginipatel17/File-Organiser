import fs from 'fs/promises';
import inquirer from 'inquirer';
import path from 'path';
import os from 'os';
import readline from 'readline';
import { exit } from 'process';
const rl=readline.createInterface({input:process.stdin,output:process.stdout});
const images=['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const videos=['.mp4', '.mkv', '.avi', '.mov'];
const document=['.pdf', '.doc', '.docx', '.txt', '.xls', '.xlsx'];
const audio=['.mp3', '.wav'];

let filepath;
const answer=await inquirer.prompt([
    {
        type:"rawlist",
        name:"action",
        message:"What do you want to do?",
        choices:[
            {name:"Organise the folder",value:"organise"},{name:"Undo Organise",value:"undo"}
        ]

    }
]);
if(answer.action==='organise'){
    const write=await inquirer.prompt([
        {type:'input',name:"writepath",message:'Do you want to write the folder path? y or n:',
            choices:['y','n']
        }
    ])
    if(write.writepath==='y'){
        const route=await inquirer.prompt([
        {type:'input',name:"path",message:'Enter the Folder path?',}
    ])
    filepath=route.path;
    await organise();
    }
    else{
         const route=await inquirer.prompt([
            {type:'input',name:"path",message:'Do you want to select the folder from your computer?y or n:',}
        ])
        if(route.path==='y'){
            const select=await inquirer.prompt([
            {
                type:"rawlist",
                name:"folder",
                message:"select folder",
                choices:[
                    {name:"Download folder",value:"Downloads"},
                    {name:"Pictures folder",value:"Pictures"},
                    {name:"Document folder",value:"Documents"},
                    {name:"Desktop folder",value:"Desktop"}
                ]

             }        
                ]);
                
                filepath=path.join(os.homedir(),select.folder);
                if (!(await fileExists(filepath))) {
                    console.log("❌ Error: The folder path does not exist.");
                    process.exit(1);
                }
                await organise();
               
            }
            else{
                exit;
            }
    }
    }
else{
    
    const write=await inquirer.prompt([
        {type:'input',name:"writepath",message:'Do you want to write the folder path? y or n:',
            choices:['y','n']
        }
    ])
    if(write.writepath==='y'){
        const route=await inquirer.prompt([
        {type:'input',name:"path",message:'Enter the Folder path?',}
    ])
    filepath=route.path;
    if (!(await fileExists(filepath))) {
    console.log("❌ Error: The folder path does not exist.");
    process.exit(1);
        }

    await disorganise();
    }
    else{
         const route=await inquirer.prompt([
            {type:'input',name:"path",message:'Do you want to select the folder from your computer?y or n:',}
        ])
        if(route.path==='y'){
            const select=await inquirer.prompt([
            {
                type:"rawlist",
                name:"folder",
                message:"select folder",
                choices:[
                    {name:"Download folder",value:"Downloads"},
                    {name:"Pictures folder",value:"Pictures"},
                    {name:"Document folder",value:"Documents"},
                    {name:"Desktop folder",value:"Desktop"}
                ]

             }        
                ]);
                
                filepath=path.join(os.homedir(),select.folder);
                await disorganise();
               
            }
            else{
                exit;
            }
}
}



async function fileExists(path) {
    try{
        await fs.access(path,fs.constants.F_OK);
        return true;
    }
    catch{
        return false;
    }
}
async function isDirEmpty(folderpath){
    const files=await fs.readdir(folderpath);
    return files.length===0;
}

function showProgress(data,total){
    const barlength=10;
    const filled=Math.round((data/total)*barlength);
    const empty=barlength-filled;
    const percent=Math.round((data)/total*100);
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    process.stdout.write(`\r[${bar}] ${percent}%`);
}

async function  organise() {
    try{
        let completed=0;
        const openfolder=await fs.opendir(filepath,{recursive:true});
        const entries = await fs.readdir(filepath, { withFileTypes: true });
        const total = entries.filter(e => e.isFile() && e.name !== 'desktop.ini').length;
        for await (const dirent of openfolder){
            const extension=path.extname(dirent.name).toLowerCase();
            let folder;
            if (!dirent.isFile()) continue;
            if (dirent.name === 'desktop.ini') continue;
                if(images.includes(extension)){
                    folder='Image Files';
                }
                else if(videos.includes(extension)){
                    folder='Video Files';
                }
                else if(document.includes(extension)){
                    folder="Document Files";
                }
                else if(audio.includes(extension)){
                    folder="Audio Files"
                }
                else{
                    folder="Other Files";
                }
                const oldfilepath=path.join(filepath,dirent.name);
                const newfilepath=path.join(filepath,folder,dirent.name);
                const dircreation=await fs.mkdir(path.join(filepath,folder), { recursive: true });
                if(await fileExists(oldfilepath)){
                    await fs.rename(oldfilepath,newfilepath);
                    completed++;
                    showProgress(completed,total);
                }
            }
        console.log(" Organising Completed");
        
    }  
    catch(err){
        console.log("Something went wrong:", err.message);
    }  
}

async function disorganise() {
    try{
        
        const folders=['Image Files','Video Files','Document Files','Audio Files','Other Files'];
                    for(const folder of folders){
                        const folderpath=path.join(filepath,folder);
                        
                        if(!await fileExists(folderpath)) continue;
                        
                         const files = (await fs.readdir(folderpath)).filter(f => f !== 'desktop.ini');
                         let completed=0;
                         const total=files.length;
                         if (total === 0) {
                            await fs.rmdir(folderpath);
                            continue;
                        }
                         
                        for(const file of files){

                            if(file==='desktop.ini') continue;
                            const oldfilepath=path.join(folderpath,file);
                            const newfilepath=path.join(filepath,file);
                            await fs.rename(oldfilepath,newfilepath);
                            completed++;
                            showProgress(completed,total);
                        }
                        
                            if(await isDirEmpty(folderpath)){
                                   await fs.rmdir(folderpath);  
                            }
                            else{
                                continue;
                            }
                            
                        }
                        console.log("UNDO Done");
  
                    }
                    catch(err){
                        console.log("Something went wrong:", err.message);
                    } 
}


