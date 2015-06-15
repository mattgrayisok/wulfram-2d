# A Game

A game helping me to learn some node.js and the basics of real time, online multiplayer.

Will become a port of Wulfram II probably, unless I have an original idea or two.

Implemented:
* Physics Engine (matter.js)
* Rendering Engine (PIXI)
* Authoritative server
* Client prediction
* Server reconciliation (difficult in a physics loop!)

Todo:
* Keep in mind authoritative client approach in case lag makes reconciliation break (https://answers.unrealengine.com/questions/58920/client-prediction-reconciliation-theory-for-physic.html)
* Client side smoothing of other players and other objects (render buffer, need to keep a buffer of incoming states and track which is currently displayed, another layer of syncing to do there)
* Shooting stuff
* Adjust renderer to follow player with camera
* Bodies representing map boundaries
* Map texture
* Consider moving over an an OO framework so I can subclass physics based units

