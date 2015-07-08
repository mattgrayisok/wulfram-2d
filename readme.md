# A Game

A game helping me to learn some node.js and the basics of real time, online multiplayer.

Will become a port of Wulfram II probably, unless I have an original idea or two.

Implemented:
* Physics Engine (matter.js)
* Rendering Engine (PIXI)
* Authoritative server
* Client prediction
* Server reconciliation (difficult in a physics loop!)
* Client side state interpolation (inc short buffer)
* Client side state extrapolation (for buffer under-runs)
* Converted players to pure JS OO - can extend into other objects now!
* Shooting stuff (main gun - no damage currently)

Todo:
* Keep in mind authoritative client approach in case lag makes reconciliation break (https://answers.unrealengine.com/questions/58920/client-prediction-reconciliation-theory-for-physic.html). Seems ok for now.
* Adjust renderer to follow player with camera
* Bodies representing map boundaries
* Map texture
* Waiting room
* Team selection

