const Discord = require("discord.js");
const ytdl = require("ytdl-core");
const request = require("request");
const fs = require("fs");
const getYouTubeID = require("get-youtube-id");
const fetchVideoInfo = require("youtube-info");

const TOKEN = "NDMyNDIwNzQ4MjkyOTE1MjAw.Da1bgA.7maqV_gL5uSBqoxoDs8jLojxk4Q";
const YT_API_KEY = "AIzaSyCdkDys7zaszI7CbCbbN0fEPRFLqefzwoc";
const PREFIX = "-";

const client = new Discord.Client();

var queue = [];
var isPlaying = false;
var dispatcher = null;

function isYoutube(str) {
    return str.indexOf("youtube.com") > -1;
}

function search_video(query, callback) {
    request("https://www.googleapis.com/youtube/v3/search?part=id&type=video&q=" + encodeURIComponent(query) + "&key=" + YT_API_KEY, function(error, response, body) {
        var json = JSON.parse(body);
        if (!json.items[0]) callback("3_-a9nVZYjk");
        else {
            callback(json.items[0].id.videoId);
        }
    });
}

function getID(str, cb) {
    if(isYoutube(str)) {
        cb(getYouTubeID(str));
    } else {
        search_video(str, function(id) {
            cb(id); 
         });
    }
}

function add_to_queue(strID) {
    if(isYoutube(strID)) {
        queue.push(getYoutubeID(strID));
    } else {
        queue.push(strID);
    }
}

function playMusic(id, message) 
{
    voiceChannel = message.member.voiceChannel;

    voiceChannel.join().then(function(connection) {
        stream = ytdl("https://www.youtube.com/watch?v=" + id, {
            filter: 'audioonly'
        });

        dispatcher = connection.playStream(stream);
        dispatcher.on('end', function() {
            queue.shift();
            if(!queue.length) {
                queue = [];
                isPlaying = false;
            } else {
                playMusic(queue[0], message);
            }
        });
    });
}

function skipMusic(message) {
    dispatcher.end();
    if(queue.length > 1) {
        playMusic(queue[0], messeage);
    }
}

client.on("warn", console.warn);

client.on("error", console.error);

client.on("ready", function() {
    console.log("Ready");
});

client.on("message", function(message) {
    if(message.author.bot) return;

    if(!message.content.startsWith(PREFIX)) return;

    const args = message.content.substring(PREFIX.length).split(" ");

    switch(args[0].toLowerCase()) {
        case "help":
            message.reply("Commands available: " + PREFIX + "info, " + PREFIX + "play, " + PREFIX + "skip, " + PREFIX + "disconnect, " + PREFIX + "clear, " + PREFIX + "pause");
            return;
        case "info":
            message.reply("I'm a robot created by a 'robot' who was made in the dark confinements of a laboratory :robot:. Lore created by Trousers©");
            return;
        case "play": {
            const voiceChannel = message.member.voiceChannel;

            if(!voiceChannel) return message.reply("You must be in a voice channel to use this command.");

            const permissions = voiceChannel.permissionsFor(message.client.user);

            if(!permissions.has("CONNECT")) return message.reply("I can't connect to your voice channel :weary:, make sure I have the proper permissions!");

            if(!permissions.has("SPEAK")) return message.reply("I can't speak in your voice channel :weary, make sure I have the proper permissions!");

            if(queue.length > 0 || isPlaying)  {
                getID(args, function(id) {
                    add_to_queue(id);
                    fetchVideoInfo(id, function(err, videoInfo) {
                        if(err) throw new Error(err);
                        message.reply("added to queue: **" + videoInfo.title + "**");
                    });
                });
            } else {
                isPlaying = true;
                getID(args, function(id) {
                    queue.push("placeholder");
                    playMusic(id, message);
                    fetchVideoInfo(id, function(err, videoInfo) {
                        if(err) throw new Error(err);
                        message.reply("now playing: **" + videoInfo.title + "**");
                    });
                });
            }
            return;
        }
        case "skip": {
            if(queue.length > 1 || isPlaying) {
                skipMusic(message);
                message.reply("Skipping...");
            }
            else {
                message.reply("I'm not playing anything right now.");
            }
            return;
        }
        case "disconnect": {
            if(voiceChannel) {
                voiceChannel.leave();
                message.reply("Disconnected.")
            } else {
                message.reply("I'm not connected to any voice channel!");
            }
            return;
        }
        case "clear": {
            if(queue.length > 1) {
                queue = [];
                message.reply("The queue has been cleared!");
            } else {
                message.reply("The queue is currently empty.")
            }
            return;
        }
        case "pause": {
            if(!isPlaying) return message.reply("I'm not playing anything!");

            if(dispatcher.paused) {
                dispatcher.resume()
                message.reply("Unpaused!");
            } else {
                dispatcher.pause()
                message.reply("Paused! ("+ PREFIX +"pause again to unpause)");
            }
            return;
        }
        case "debug": {
            message.channel.send("" + queue.length + "");
            return;
        }
        default:
            message.channel.send("You tried to input a command to me, but, yeah... that's invalid.");
    }
});

client.login(TOKEN);
