"""Validate substituted notification blueprint with Home Assistant's schema."""
from pathlib import Path
import asyncio
import yaml
from homeassistant.components.automation.config import PLATFORM_SCHEMA
from homeassistant.core import HomeAssistant

values = {'alarm':'binary_sensor.bm_alarm','step':'sensor.bm_step',
          'connection':'sensor.bm_connection','lights':['light.bathroom'], 'extra_actions':[],
          'information_color':[0,255,0], 'attention_color':[255,0,0]}
class Loader(yaml.SafeLoader):
    pass
Loader.add_constructor('!input', lambda loader,node: values[loader.construct_scalar(node)])
data=yaml.load(Path('blueprints/braumeister-alarm-light.yaml').read_text(), Loader=Loader)
data.pop('blueprint')
async def main():
    HomeAssistant('/tmp/blueprint-validation')
    PLATFORM_SCHEMA(data)
    print('PASS: Home Assistant automation schema after blueprint substitution')
asyncio.run(main())
