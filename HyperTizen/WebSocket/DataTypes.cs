using System.Collections.Generic;

namespace HyperTizen.WebSocket.DataTypes
{
    public enum Event
    {
        SetConfig,
        ReadConfig,
        ReadConfigResult,
        ScanUPnP,
        UPnPScanResult
    }

    public class BasicEvent
    {
        public Event Event { get; set; }
    }

    public class SetConfigEvent : BasicEvent
    {
        public string key { get; set; }
        public string value { get; set; }
    }

    public class ReadConfigEvent : BasicEvent
    {
        public string key { get; set; }
    }

    public class ReadConfigResultEvent : BasicEvent
    {
        public ReadConfigResultEvent(bool error, string key, object value)
        {
            this.Event = Event.ReadConfigResult;
            this.error = error;
            this.value = value;
            this.key = key;
        }

        public bool error { get; set; }
        public string key { get; set; }
        public object value { get; set; }
    }

    public class UPnPScanResultEvent : BasicEvent
    {
        public UPnPScanResultEvent(List<UPnPDevice> devices)
        {
            this.devices = devices;
            this.Event = Event.UPnPScanResult;
        }
        public List<UPnPDevice> devices { get; set; }
        public class UPnPDevice
        {
            public string FriendlyName { get; set; }
            public string UrlBase { get; set; }

            public UPnPDevice(string friendlyName, string urlBase)
            {
                FriendlyName = friendlyName;
                UrlBase = urlBase;
            }
        }
    }

    public class ImageCommand
    {
        public ImageCommand(string image)
        {
            imagedata = image;
        }

        public string command { get; set; } = "image";
        public string imagedata { get; set; }
        public string name { get; set; } = "HyperTizen Data";
        public string format { get; set; } = "auto";
        public byte priority { get; set; } = 99;
        public string origin { get; set; } = "HyperTizen";
    }
}
