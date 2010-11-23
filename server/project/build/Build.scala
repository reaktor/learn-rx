import sbt._

class Build(info: ProjectInfo) extends DefaultWebProject(info) {
  val jetty6   = "org.mortbay.jetty" % "jetty" % "6.1.14" % "test"
  val servlet  = "org.mortbay.jetty" % "servlet-api" % "2.5-20081211" % "provided"
  val json     = "net.liftweb" %% "lift-json" % "2.1"
  val scalatra = "org.scalatra" %% "scalatra" % "2.0.0.M1"
  val http     = "net.databinder" %% "dispatch-mime" % "0.7.4"
}

